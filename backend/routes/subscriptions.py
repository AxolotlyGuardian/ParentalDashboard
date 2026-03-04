from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db import get_db
from models import User, Subscription
from auth_utils import require_parent, require_admin
from config import settings

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# ---------------------------------------------------------------------------
# Pricing constants
# ---------------------------------------------------------------------------

# Single subscription plan: $14.99/month or $149.90/year (2 months free)
PLAN_CONFIG = {
    "axolotly": {
        "name": "Axolotly",
        "price_monthly": 1499,           # $14.99/month in cents
        "price_annual": 14990,           # $149.90/year in cents (~$12.49/mo, 2 months free)
        "device_limit": 20,              # soft cap; hardware units drive the real limit
        "features": [
            "Unlimited child profiles",
            "Full app blocking & allow-listing",
            "Screen time limits & bedtime schedule",
            "Detailed usage reports & trends",
            "Web content filtering (coming soon)",
            "Real-time parent dashboard",
            "Secure cloud syncing",
            "Priority support",
        ],
        "stripe_price_id": settings.STRIPE_PRICE_AXOLOTLY,
        "stripe_price_id_annual": settings.STRIPE_PRICE_AXOLOTLY_ANNUAL,
    },
}

# Hardware: $45/unit with multi-device bundle discounts
HARDWARE_PRICE_CENTS = 4500  # $45.00 per unit

# Bundle discounts applied per-unit based on quantity ordered
# 1 device  → full price
# 2 devices → 5% off  → $42.75/unit
# 3 devices → 10% off → $40.50/unit
# 4+ devices → 15% off → $38.25/unit
def get_hardware_discount(units: int) -> float:
    """Return the discount multiplier for the given number of units."""
    if units >= 4:
        return 0.85   # 15% off
    elif units == 3:
        return 0.90   # 10% off
    elif units == 2:
        return 0.95   # 5% off
    else:
        return 1.00   # no discount


def get_hardware_unit_price(units: int) -> int:
    """Return the per-unit hardware price in cents after bundle discount."""
    return round(HARDWARE_PRICE_CENTS * get_hardware_discount(units))


def get_hardware_total(units: int) -> int:
    """Return the total hardware cost in cents."""
    return get_hardware_unit_price(units) * units


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateCheckoutRequest(BaseModel):
    plan: str = "axolotly"
    billing_period: str = "monthly"   # "monthly" or "annual"
    hardware_units: int = 1
    success_url: str
    cancel_url: str


class SubscriptionStatusResponse(BaseModel):
    plan: Optional[str] = None
    status: Optional[str] = None
    billing_period: Optional[str] = None
    device_limit: Optional[int] = None
    hardware_units: Optional[int] = None
    current_period_end: Optional[str] = None
    has_subscription: bool = False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/plans")
def get_plans():
    """Return the Axolotly subscription plan and hardware pricing details."""
    plans = []
    for plan_id, config in PLAN_CONFIG.items():
        monthly = config["price_monthly"]
        annual = config["price_annual"]
        annual_savings = (monthly * 12) - annual  # $29.98 saved vs monthly

        plans.append({
            "id": plan_id,
            "name": config["name"],
            "price_monthly_cents": monthly,
            "price_monthly_display": f"${monthly / 100:.2f}/mo",
            "price_annual_cents": annual,
            "price_annual_display": f"${annual / 100:.2f}/yr",
            "price_annual_monthly_equivalent": f"${annual / 12 / 100:.2f}/mo",
            "annual_savings_cents": annual_savings,
            "annual_savings_display": f"Save ${annual_savings / 100:.2f}/yr",
            "device_limit": config["device_limit"],
            "features": config["features"],
        })

    # Build hardware pricing table for the frontend
    hardware_tiers = []
    for units in [1, 2, 3, 4]:
        unit_price = get_hardware_unit_price(units)
        discount_pct = round((1 - get_hardware_discount(units)) * 100)
        hardware_tiers.append({
            "units": units,
            "label": f"{units} device{'s' if units > 1 else ''}",
            "per_unit_cents": unit_price,
            "per_unit_display": f"${unit_price / 100:.2f}/unit",
            "total_cents": get_hardware_total(units),
            "total_display": f"${get_hardware_total(units) / 100:.2f}",
            "discount_pct": discount_pct,
            "savings_display": f"Save {discount_pct}%" if discount_pct > 0 else None,
        })

    return {
        "plans": plans,
        "hardware_base_price_cents": HARDWARE_PRICE_CENTS,
        "hardware_base_price_display": f"${HARDWARE_PRICE_CENTS / 100:.2f}",
        "hardware_tiers": hardware_tiers,
        "annual_billing_note": "Annual billing saves you 2 months compared to monthly.",
        "bundle_discount_note": "Multi-device discounts: 5% off 2 units, 10% off 3 units, 15% off 4+ units.",
    }


@router.post("/create-checkout")
def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for the Axolotly subscription + hardware purchase."""
    if request.plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail=f"Invalid plan '{request.plan}'. Valid plans: {list(PLAN_CONFIG.keys())}")

    if request.billing_period not in ("monthly", "annual"):
        raise HTTPException(status_code=400, detail="billing_period must be 'monthly' or 'annual'")

    if request.hardware_units < 1 or request.hardware_units > 20:
        raise HTTPException(status_code=400, detail="hardware_units must be between 1 and 20")

    plan = PLAN_CONFIG[request.plan]

    # Dev mode: activate subscription without Stripe
    if not settings.STRIPE_SECRET_KEY:
        sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
        if not sub:
            sub = Subscription(
                user_id=current_user.id,
                plan=request.plan,
                status="active",
                device_limit=plan["device_limit"],
                hardware_units=request.hardware_units,
                current_period_start=datetime.utcnow(),
            )
            db.add(sub)
        else:
            sub.plan = request.plan
            sub.status = "active"
            sub.device_limit = plan["device_limit"]
            sub.hardware_units = request.hardware_units
        db.commit()
        return {
            "checkout_url": request.success_url + "?session_id=dev_mode",
            "session_id": "dev_mode",
            "message": "Stripe not configured — subscription activated in dev mode",
        }

    # Select monthly or annual Stripe price ID
    stripe_price_id = (
        plan["stripe_price_id_annual"]
        if request.billing_period == "annual"
        else plan["stripe_price_id"]
    )

    if not stripe_price_id:
        raise HTTPException(
            status_code=503,
            detail=f"Stripe price ID not configured for '{request.plan}' ({request.billing_period}). "
                   f"Set STRIPE_PRICE_AXOLOTLY or STRIPE_PRICE_AXOLOTLY_ANNUAL env vars.",
        )

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        # Hardware cost with bundle discount
        unit_price = get_hardware_unit_price(request.hardware_units)
        total_hardware = get_hardware_total(request.hardware_units)
        discount_pct = round((1 - get_hardware_discount(request.hardware_units)) * 100)

        hardware_description = f"${unit_price / 100:.2f}/unit"
        if discount_pct > 0:
            hardware_description += f" ({discount_pct}% multi-device discount)"

        line_items = [
            {
                "price": stripe_price_id,
                "quantity": 1,
            },
        ]

        if request.hardware_units > 0:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Axolotly Device × {request.hardware_units}",
                        "description": hardware_description,
                    },
                    "unit_amount": unit_price,
                },
                "quantity": request.hardware_units,
            })

        checkout_session = stripe.checkout.Session.create(
            mode="subscription",
            customer_email=current_user.email,
            line_items=line_items,
            success_url=request.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.cancel_url,
            metadata={
                "user_id": str(current_user.id),
                "plan": request.plan,
                "billing_period": request.billing_period,
                "hardware_units": str(request.hardware_units),
            },
        )

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
        }
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Stripe library not installed. Run: pip install stripe",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", response_model=SubscriptionStatusResponse)
def get_subscription_status(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Get current user's subscription status."""
    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if not sub:
        return SubscriptionStatusResponse(has_subscription=False)

    return SubscriptionStatusResponse(
        plan=sub.plan,
        status=sub.status,
        billing_period=getattr(sub, "billing_period", None),
        device_limit=sub.device_limit,
        hardware_units=sub.hardware_units,
        current_period_end=sub.current_period_end.isoformat() if sub.current_period_end else None,
        has_subscription=True,
    )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events for subscription lifecycle."""
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ImportError:
        raise HTTPException(status_code=503, detail="Stripe library not installed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        plan_id = session["metadata"].get("plan", "axolotly")
        billing_period = session["metadata"].get("billing_period", "monthly")
        hardware_units = int(session["metadata"].get("hardware_units", 1))
        plan_config = PLAN_CONFIG.get(plan_id, PLAN_CONFIG["axolotly"])

        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not sub:
            sub = Subscription(user_id=user_id)
            db.add(sub)

        sub.stripe_customer_id = session.get("customer")
        sub.stripe_subscription_id = session.get("subscription")
        sub.plan = plan_id
        sub.status = "active"
        sub.device_limit = plan_config["device_limit"]
        sub.hardware_units = hardware_units
        sub.current_period_start = datetime.utcnow()
        # Store billing period if the model supports it
        if hasattr(sub, "billing_period"):
            sub.billing_period = billing_period
        db.commit()

    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        sub = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription["id"]
        ).first()
        if sub:
            sub.status = subscription["status"]
            if subscription.get("current_period_end"):
                sub.current_period_end = datetime.fromtimestamp(subscription["current_period_end"])
            db.commit()

    elif event["type"] in ("customer.subscription.deleted", "invoice.payment_failed"):
        obj = event["data"]["object"]
        sub_id = obj["id"] if event["type"] == "customer.subscription.deleted" else obj.get("subscription")
        if sub_id:
            sub = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == sub_id
            ).first()
            if sub:
                sub.status = "canceled" if "deleted" in event["type"] else "past_due"
                db.commit()

    return {"received": True}


@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Cancel the current user's subscription at period end."""
    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active",
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")

    if settings.STRIPE_SECRET_KEY and sub.stripe_subscription_id:
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe.Subscription.modify(
                sub.stripe_subscription_id,
                cancel_at_period_end=True,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to cancel: {str(e)}")

    sub.status = "canceled"
    db.commit()
    return {"message": "Subscription canceled", "status": "canceled"}


@router.get("/admin/all")
def get_all_subscriptions(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: View all subscriptions."""
    subs = db.query(Subscription).all()
    result = []
    for sub in subs:
        user = db.query(User).filter(User.id == sub.user_id).first()
        result.append({
            "id": sub.id,
            "user_email": user.email if user else None,
            "plan": sub.plan,
            "status": sub.status,
            "billing_period": getattr(sub, "billing_period", None),
            "device_limit": sub.device_limit,
            "hardware_units": sub.hardware_units,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
        })
    return result
