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

PLAN_CONFIG = {
    "starter": {
        "name": "Starter",
        "price_monthly": 499,  # cents
        "device_limit": 1,
        "stripe_price_id": "price_starter_monthly",
    },
    "family": {
        "name": "Family",
        "price_monthly": 999,
        "device_limit": 3,
        "stripe_price_id": "price_family_monthly",
    },
    "educator": {
        "name": "Educator",
        "price_monthly": 1999,
        "device_limit": 10,
        "stripe_price_id": "price_educator_monthly",
    },
}

HARDWARE_PRICE_CENTS = 3900  # $39 per unit
BUNDLE_DISCOUNTS = {
    1: 1.0,    # no discount
    2: 0.80,   # 20% off
    3: 0.70,   # 30% off
}


class CreateCheckoutRequest(BaseModel):
    plan: str
    hardware_units: int = 1
    success_url: str
    cancel_url: str


class SubscriptionStatusResponse(BaseModel):
    plan: Optional[str] = None
    status: Optional[str] = None
    device_limit: Optional[int] = None
    hardware_units: Optional[int] = None
    current_period_end: Optional[str] = None
    has_subscription: bool = False


@router.get("/plans")
def get_plans():
    """Return available subscription plans and hardware pricing."""
    plans = []
    for plan_id, config in PLAN_CONFIG.items():
        plans.append({
            "id": plan_id,
            "name": config["name"],
            "price_monthly_cents": config["price_monthly"],
            "price_monthly_display": f"${config['price_monthly'] / 100:.2f}",
            "device_limit": config["device_limit"],
        })

    return {
        "plans": plans,
        "hardware_price_cents": HARDWARE_PRICE_CENTS,
        "hardware_price_display": f"${HARDWARE_PRICE_CENTS / 100:.2f}",
        "bundle_discounts": {
            str(k): f"{int((1 - v) * 100)}% off" for k, v in BUNDLE_DISCOUNTS.items() if v < 1.0
        },
    }


@router.post("/create-checkout")
def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for subscription + hardware purchase."""
    if request.plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if request.hardware_units < 1 or request.hardware_units > 20:
        raise HTTPException(status_code=400, detail="Hardware units must be between 1 and 20")

    plan = PLAN_CONFIG[request.plan]

    if not settings.STRIPE_SECRET_KEY:
        # Return a mock session for development without Stripe keys
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
            "message": "Stripe not configured - subscription activated in dev mode",
        }

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        # Calculate hardware cost with bundle discount
        discount = BUNDLE_DISCOUNTS.get(request.hardware_units, 0.65)
        hardware_unit_price = int(HARDWARE_PRICE_CENTS * discount)

        line_items = [
            {
                "price": plan["stripe_price_id"],
                "quantity": 1,
            },
        ]

        if request.hardware_units > 0:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Axolotly Device ({request.hardware_units} unit{'s' if request.hardware_units > 1 else ''})",
                        "description": f"Axolotly parental control hardware - ${hardware_unit_price / 100:.2f}/unit",
                    },
                    "unit_amount": hardware_unit_price,
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
        plan = session["metadata"]["plan"]
        hardware_units = int(session["metadata"].get("hardware_units", 1))
        plan_config = PLAN_CONFIG.get(plan, PLAN_CONFIG["starter"])

        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not sub:
            sub = Subscription(user_id=user_id)
            db.add(sub)

        sub.stripe_customer_id = session.get("customer")
        sub.stripe_subscription_id = session.get("subscription")
        sub.plan = plan
        sub.status = "active"
        sub.device_limit = plan_config["device_limit"]
        sub.hardware_units = hardware_units
        sub.current_period_start = datetime.utcnow()
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
    """Cancel the current user's subscription."""
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
            "device_limit": sub.device_limit,
            "hardware_units": sub.hardware_units,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
        })
    return result
