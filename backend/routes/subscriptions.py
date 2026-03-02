from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from db import get_db
from models import User, Subscription
from auth_utils import require_parent, require_admin
from config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# ---------------------------------------------------------------------------
# Pricing: $45 one-time device fee + $14.99/mo  OR  $194.90/yr annual bundle
# ---------------------------------------------------------------------------

DEVICE_FEE_CENTS = 4500  # $45 one-time per device

PLAN_CONFIG = {
    "monthly": {
        "name": "Monthly",
        "price_cents": 1499,         # $14.99/mo
        "price_display": "$14.99/mo",
        "interval": "month",
        "stripe_price_id": settings.STRIPE_PRICE_MONTHLY,
    },
    "annual": {
        "name": "Annual",
        "price_cents": 19490,        # $194.90/yr ($16.24/mo equivalent)
        "price_display": "$194.90/yr",
        "interval": "year",
        "stripe_price_id": settings.STRIPE_PRICE_ANNUAL,
    },
}


class CreateCheckoutRequest(BaseModel):
    plan: str                      # "monthly" or "annual"
    hardware_units: int = 1        # number of Axolotly devices
    success_url: str
    cancel_url: str


class SubscriptionStatusResponse(BaseModel):
    plan: Optional[str] = None
    status: Optional[str] = None
    device_limit: Optional[int] = None
    hardware_units: Optional[int] = None
    current_period_end: Optional[str] = None
    has_subscription: bool = False
    cancel_at_period_end: bool = False


class ChangePlanRequest(BaseModel):
    new_plan: str                  # "monthly" or "annual"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/plans")
def get_plans():
    """Return available subscription plans and hardware pricing."""
    plans = []
    for plan_id, cfg in PLAN_CONFIG.items():
        plans.append({
            "id": plan_id,
            "name": cfg["name"],
            "price_cents": cfg["price_cents"],
            "price_display": cfg["price_display"],
            "interval": cfg["interval"],
        })

    return {
        "plans": plans,
        "device_fee_cents": DEVICE_FEE_CENTS,
        "device_fee_display": f"${DEVICE_FEE_CENTS / 100:.2f}",
    }


@router.post("/create-checkout")
def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for subscription + device purchase."""
    if request.plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose 'monthly' or 'annual'.")

    if request.hardware_units < 1 or request.hardware_units > 20:
        raise HTTPException(status_code=400, detail="Hardware units must be 1-20.")

    plan = PLAN_CONFIG[request.plan]

    # --- Dev mode (no Stripe keys) ---
    if not settings.STRIPE_SECRET_KEY:
        sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
        if not sub:
            sub = Subscription(
                user_id=current_user.id,
                plan=request.plan,
                status="active",
                device_limit=request.hardware_units,
                hardware_units=request.hardware_units,
                current_period_start=datetime.utcnow(),
            )
            db.add(sub)
        else:
            sub.plan = request.plan
            sub.status = "active"
            sub.device_limit = request.hardware_units
            sub.hardware_units = request.hardware_units
        db.commit()

        return {
            "checkout_url": request.success_url + "?session_id=dev_mode",
            "session_id": "dev_mode",
            "message": "Stripe not configured - subscription activated in dev mode",
        }

    # --- Production Stripe flow ---
    if not plan["stripe_price_id"]:
        raise HTTPException(
            status_code=503,
            detail=f"Stripe price ID not configured for '{request.plan}'. Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL.",
        )

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = [
            # Recurring subscription
            {
                "price": plan["stripe_price_id"],
                "quantity": 1,
            },
        ]

        # One-time device fee
        if request.hardware_units > 0:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Axolotly Device ({request.hardware_units} unit{'s' if request.hardware_units > 1 else ''})",
                        "description": "Axolotly parental control hardware — $45 per device",
                    },
                    "unit_amount": DEVICE_FEE_CENTS,
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
            subscription_data={
                "metadata": {
                    "user_id": str(current_user.id),
                    "plan": request.plan,
                },
            },
        )

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
        }
    except ImportError:
        raise HTTPException(status_code=503, detail="Stripe library not installed.")
    except Exception as e:
        logger.error("Stripe checkout error: %s", e)
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
        cancel_at_period_end=getattr(sub, "cancel_at_period_end", False) or False,
    )


@router.post("/change-plan")
def change_plan(
    request: ChangePlanRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Switch between monthly and annual billing."""
    if request.new_plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan.")

    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_(["active", "past_due"]),
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found.")

    if sub.plan == request.new_plan:
        raise HTTPException(status_code=400, detail="Already on this plan.")

    new_plan = PLAN_CONFIG[request.new_plan]

    # Dev mode
    if not settings.STRIPE_SECRET_KEY:
        sub.plan = request.new_plan
        db.commit()
        return {"message": f"Switched to {new_plan['name']} plan (dev mode)", "plan": request.new_plan}

    if not sub.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No Stripe subscription to modify.")

    if not new_plan["stripe_price_id"]:
        raise HTTPException(status_code=503, detail="Stripe price not configured for target plan.")

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        stripe_sub = stripe.Subscription.retrieve(sub.stripe_subscription_id)
        stripe.Subscription.modify(
            sub.stripe_subscription_id,
            items=[{
                "id": stripe_sub["items"]["data"][0]["id"],
                "price": new_plan["stripe_price_id"],
            }],
            proration_behavior="create_prorations",
            metadata={
                "user_id": str(current_user.id),
                "plan": request.new_plan,
            },
        )

        sub.plan = request.new_plan
        db.commit()

        return {"message": f"Switched to {new_plan['name']} plan", "plan": request.new_plan}
    except Exception as e:
        logger.error("Plan change error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Cancel the subscription at end of current period."""
    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_(["active", "past_due"]),
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found.")

    if settings.STRIPE_SECRET_KEY and sub.stripe_subscription_id:
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe.Subscription.modify(
                sub.stripe_subscription_id,
                cancel_at_period_end=True,
            )
        except Exception as e:
            logger.error("Stripe cancel error: %s", e)
            raise HTTPException(status_code=500, detail=f"Failed to cancel: {str(e)}")

    sub.status = "canceled"
    db.commit()

    return {"message": "Subscription will end at the current billing period.", "status": "canceled"}


@router.post("/reactivate")
def reactivate_subscription(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Undo a pending cancellation (if still within the billing period)."""
    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "canceled",
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="No canceled subscription found.")

    if settings.STRIPE_SECRET_KEY and sub.stripe_subscription_id:
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe.Subscription.modify(
                sub.stripe_subscription_id,
                cancel_at_period_end=False,
            )
        except Exception as e:
            logger.error("Reactivate error: %s", e)
            raise HTTPException(status_code=500, detail=str(e))

    sub.status = "active"
    db.commit()

    return {"message": "Subscription reactivated.", "status": "active"}


# ---------------------------------------------------------------------------
# Webhook
# ---------------------------------------------------------------------------

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events for subscription lifecycle + dunning."""
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

    event_type = event["type"]
    obj = event["data"]["object"]

    # --- checkout.session.completed ---
    if event_type == "checkout.session.completed":
        user_id = int(obj["metadata"]["user_id"])
        plan = obj["metadata"]["plan"]
        hardware_units = int(obj["metadata"].get("hardware_units", 1))

        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not sub:
            sub = Subscription(user_id=user_id)
            db.add(sub)

        sub.stripe_customer_id = obj.get("customer")
        sub.stripe_subscription_id = obj.get("subscription")
        sub.plan = plan
        sub.status = "active"
        sub.device_limit = hardware_units
        sub.hardware_units = hardware_units
        sub.current_period_start = datetime.utcnow()
        db.commit()
        logger.info("Subscription created for user %s, plan=%s", user_id, plan)

    # --- subscription.created ---
    elif event_type == "customer.subscription.created":
        sub_id = obj["id"]
        customer_id = obj.get("customer")
        sub = db.query(Subscription).filter(
            Subscription.stripe_customer_id == customer_id
        ).first()
        if sub:
            sub.stripe_subscription_id = sub_id
            sub.status = obj.get("status", "active")
            if obj.get("current_period_end"):
                sub.current_period_end = datetime.fromtimestamp(obj["current_period_end"])
            db.commit()

    # --- subscription.updated ---
    elif event_type == "customer.subscription.updated":
        sub = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == obj["id"]
        ).first()
        if sub:
            sub.status = obj["status"]
            if obj.get("current_period_end"):
                sub.current_period_end = datetime.fromtimestamp(obj["current_period_end"])
            db.commit()

    # --- subscription.deleted ---
    elif event_type == "customer.subscription.deleted":
        sub = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == obj["id"]
        ).first()
        if sub:
            sub.status = "canceled"
            db.commit()
            logger.info("Subscription %s canceled", obj["id"])

    # --- invoice.payment_succeeded ---
    elif event_type == "invoice.payment_succeeded":
        sub_id = obj.get("subscription")
        if sub_id:
            sub = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == sub_id
            ).first()
            if sub:
                sub.status = "active"
                sub.dunning_step = 0
                if obj.get("period_end"):
                    sub.current_period_end = datetime.fromtimestamp(obj["period_end"])
                db.commit()

    # --- invoice.payment_failed (dunning trigger) ---
    elif event_type == "invoice.payment_failed":
        sub_id = obj.get("subscription")
        if sub_id:
            sub = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == sub_id
            ).first()
            if sub:
                sub.status = "past_due"
                dunning_step = getattr(sub, "dunning_step", 0) or 0
                sub.dunning_step = dunning_step + 1
                db.commit()

                # Queue dunning email
                user = db.query(User).filter(User.id == sub.user_id).first()
                if user:
                    _send_dunning_email(user.email, sub.dunning_step)

    # --- charge.refunded ---
    elif event_type == "charge.refunded":
        customer_id = obj.get("customer")
        if customer_id:
            sub = db.query(Subscription).filter(
                Subscription.stripe_customer_id == customer_id
            ).first()
            if sub:
                logger.info("Charge refunded for customer %s", customer_id)

    return {"received": True}


# ---------------------------------------------------------------------------
# Dunning helper
# ---------------------------------------------------------------------------

DUNNING_MESSAGES = {
    1: {
        "subject": "Payment failed - please update your card",
        "body": (
            "Hi! We couldn't process your Axolotly subscription payment. "
            "Please update your payment method to keep your family's protection active."
        ),
    },
    2: {
        "subject": "Action needed: your Axolotly subscription is at risk",
        "body": (
            "We've tried to charge your card again but it was declined. "
            "Please update your payment method within the next few days to avoid service interruption."
        ),
    },
    3: {
        "subject": "Final notice: Axolotly service will be suspended",
        "body": (
            "This is your final notice. If we can't process payment within 24 hours, "
            "your Axolotly parental controls will be suspended. Please update your card now."
        ),
    },
}


def _send_dunning_email(email: str, step: int):
    """Send a dunning email. Falls back to logging if SendGrid is not configured."""
    msg = DUNNING_MESSAGES.get(step)
    if not msg:
        return

    if not settings.SENDGRID_API_KEY:
        logger.warning(
            "DUNNING (step %d) to %s — %s  [SendGrid not configured, email not sent]",
            step, email, msg["subject"],
        )
        return

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        message = Mail(
            from_email=settings.EMAIL_FROM,
            to_emails=email,
            subject=msg["subject"],
            plain_text_content=msg["body"],
        )
        sg.send(message)
        logger.info("Dunning email (step %d) sent to %s", step, email)
    except Exception as e:
        logger.error("Failed to send dunning email to %s: %s", email, e)


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

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
