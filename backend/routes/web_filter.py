"""
Web Filtering Routes (Scaffold)
================================
This module provides the data model and API scaffolding for a future
web content filtering feature.  The Android TV launcher currently
controls app-level access; this module lays the groundwork for URL/domain-
level filtering when a VPN or DNS-based filtering solution is integrated.

Architecture note:
  The recommended implementation path is a local DNS resolver on the
  device (e.g., a lightweight DNS-over-HTTPS proxy) that queries this
  API to decide whether to allow or block a domain.  This avoids the
  need for a full VPN and works within Android TV constraints.

Current state:
  - Domain blocklist/allowlist management (CRUD)
  - Category-based blocking (e.g., "adult", "gambling", "social_media")
  - Per-child profile overrides
  - DNS lookup endpoint for device-side enforcement (scaffold)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
import enum

from db import get_db, Base
from models import KidProfile
from auth_utils import get_current_user

router = APIRouter(prefix="/web-filter", tags=["web_filter"])


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class FilterAction(str, enum.Enum):
    BLOCK = "block"
    ALLOW = "allow"


class FilterCategory(str, enum.Enum):
    ADULT = "adult"
    GAMBLING = "gambling"
    SOCIAL_MEDIA = "social_media"
    GAMING = "gaming"
    VIOLENCE = "violence"
    DRUGS = "drugs"
    HATE_SPEECH = "hate_speech"
    CUSTOM = "custom"


# ---------------------------------------------------------------------------
# Database models (to be added to models.py in a future migration)
# ---------------------------------------------------------------------------

class WebFilterRule(Base):
    """A domain-level allow or block rule for a specific child profile."""
    __tablename__ = "web_filter_rules"

    id = Column(Integer, primary_key=True, index=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)       # e.g. "youtube.com"
    action = Column(SAEnum(FilterAction), nullable=False)     # "block" or "allow"
    category = Column(SAEnum(FilterCategory), nullable=True)  # optional category tag
    note = Column(String, nullable=True)                      # parent-supplied note
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WebFilterCategoryPolicy(Base):
    """Category-level blocking policy for a child profile."""
    __tablename__ = "web_filter_category_policies"

    id = Column(Integer, primary_key=True, index=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=False, index=True)
    category = Column(SAEnum(FilterCategory), nullable=False)
    blocked = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class WebFilterRuleCreate(BaseModel):
    domain: str
    action: FilterAction
    category: Optional[FilterCategory] = None
    note: Optional[str] = None


class WebFilterRuleResponse(BaseModel):
    id: int
    domain: str
    action: FilterAction
    category: Optional[FilterCategory]
    note: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class CategoryPolicyUpdate(BaseModel):
    category: FilterCategory
    blocked: bool


class DnsLookupRequest(BaseModel):
    """Request from the device-side DNS proxy to check if a domain is allowed."""
    domain: str
    kid_profile_id: int
    device_api_key: str  # The device authenticates with its API key


class DnsLookupResponse(BaseModel):
    domain: str
    allowed: bool
    reason: str  # "allowed_by_rule", "blocked_by_rule", "blocked_by_category", "allowed_by_default"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/rules/{kid_profile_id}", response_model=List[WebFilterRuleResponse])
def get_filter_rules(
    kid_profile_id: int,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all domain filter rules for a child profile."""
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    kid = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == user.id,
    ).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Child profile not found")

    rules = db.query(WebFilterRule).filter(
        WebFilterRule.kid_profile_id == kid_profile_id
    ).order_by(WebFilterRule.created_at.desc()).all()

    return [
        WebFilterRuleResponse(
            id=r.id,
            domain=r.domain,
            action=r.action,
            category=r.category,
            note=r.note,
            created_at=r.created_at.isoformat(),
        )
        for r in rules
    ]


@router.post("/rules/{kid_profile_id}", response_model=WebFilterRuleResponse)
def create_filter_rule(
    kid_profile_id: int,
    rule: WebFilterRuleCreate,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a domain allow or block rule for a child profile."""
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    kid = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == user.id,
    ).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Child profile not found")

    # Normalize domain: strip protocol and www prefix
    domain = rule.domain.lower().strip()
    domain = domain.replace("https://", "").replace("http://", "").split("/")[0]
    if domain.startswith("www."):
        domain = domain[4:]

    # Check for duplicate
    existing = db.query(WebFilterRule).filter(
        WebFilterRule.kid_profile_id == kid_profile_id,
        WebFilterRule.domain == domain,
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A rule for '{domain}' already exists for this child profile.",
        )

    new_rule = WebFilterRule(
        kid_profile_id=kid_profile_id,
        domain=domain,
        action=rule.action,
        category=rule.category,
        note=rule.note,
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return WebFilterRuleResponse(
        id=new_rule.id,
        domain=new_rule.domain,
        action=new_rule.action,
        category=new_rule.category,
        note=new_rule.note,
        created_at=new_rule.created_at.isoformat(),
    )


@router.delete("/rules/{rule_id}")
def delete_filter_rule(
    rule_id: int,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a domain filter rule."""
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    rule = db.query(WebFilterRule).filter(WebFilterRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Verify ownership via kid profile
    kid = db.query(KidProfile).filter(
        KidProfile.id == rule.kid_profile_id,
        KidProfile.parent_id == user.id,
    ).first()
    if not kid:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(rule)
    db.commit()
    return {"success": True, "deleted_rule_id": rule_id}


@router.get("/categories/{kid_profile_id}")
def get_category_policies(
    kid_profile_id: int,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the category-level blocking policy for a child profile."""
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    kid = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == user.id,
    ).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Child profile not found")

    policies = db.query(WebFilterCategoryPolicy).filter(
        WebFilterCategoryPolicy.kid_profile_id == kid_profile_id
    ).all()

    # Build a complete map including defaults (all categories default to blocked=False)
    policy_map = {p.category: p.blocked for p in policies}
    result = []
    for cat in FilterCategory:
        result.append({
            "category": cat.value,
            "blocked": policy_map.get(cat, False),
        })
    return {"kid_profile_id": kid_profile_id, "categories": result}


@router.post("/categories/{kid_profile_id}")
def update_category_policy(
    kid_profile_id: int,
    update: CategoryPolicyUpdate,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enable or disable category-level blocking for a child profile."""
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    kid = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == user.id,
    ).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Child profile not found")

    policy = db.query(WebFilterCategoryPolicy).filter(
        WebFilterCategoryPolicy.kid_profile_id == kid_profile_id,
        WebFilterCategoryPolicy.category == update.category,
    ).first()

    if policy:
        policy.blocked = update.blocked
    else:
        policy = WebFilterCategoryPolicy(
            kid_profile_id=kid_profile_id,
            category=update.category,
            blocked=update.blocked,
        )
        db.add(policy)

    db.commit()
    return {
        "success": True,
        "kid_profile_id": kid_profile_id,
        "category": update.category,
        "blocked": update.blocked,
    }


@router.post("/dns-lookup", response_model=DnsLookupResponse)
def dns_lookup(
    request: DnsLookupRequest,
    db: Session = Depends(get_db),
):
    """
    Device-side DNS proxy endpoint.

    The Android device's local DNS resolver calls this endpoint to determine
    whether a domain should be allowed or blocked for the active child profile.

    Authentication is via the device's API key (same key used for launcher auth).

    Resolution order:
      1. Explicit ALLOW rule  -> allowed
      2. Explicit BLOCK rule  -> blocked
      3. Category BLOCK policy -> blocked
      4. Default             -> allowed
    """
    from models import Device
    from auth_utils import hash_api_key

    # Authenticate the device by its API key
    api_key_hash = hash_api_key(request.device_api_key)
    device = db.query(Device).filter(
        Device.api_key_hash == api_key_hash,
        Device.kid_profile_id == request.kid_profile_id,
    ).first()

    if not device:
        raise HTTPException(status_code=401, detail="Invalid device credentials")

    domain = request.domain.lower().strip()
    if domain.startswith("www."):
        domain = domain[4:]

    # 1. Check explicit domain rules
    rule = db.query(WebFilterRule).filter(
        WebFilterRule.kid_profile_id == request.kid_profile_id,
        WebFilterRule.domain == domain,
    ).first()

    if rule:
        if rule.action == FilterAction.ALLOW:
            return DnsLookupResponse(domain=domain, allowed=True, reason="allowed_by_rule")
        else:
            return DnsLookupResponse(domain=domain, allowed=False, reason="blocked_by_rule")

    # 2. Check category policies (if the rule has a category tag)
    # In a full implementation, a domain categorization service (e.g., Cloudflare
    # Gateway or a local blocklist) would provide the category for any domain.
    # For now, we return the default allow.

    return DnsLookupResponse(domain=domain, allowed=True, reason="allowed_by_default")
