from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from db import get_db
from models import (
    ContentPackage, ContentPackageItem, AppliedPackage, PackageUpdate,
    Policy, Title, KidProfile, User,
)
from auth_utils import require_parent, require_admin
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/packages", tags=["packages"])


# --- Request / Response schemas ---

class PackageCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    category: str  # age_band, theme, genre
    icon: Optional[str] = None


class PackageUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class AddItemsRequest(BaseModel):
    title_ids: List[int]


class ApplyPackageRequest(BaseModel):
    kid_profile_id: int
    excluded_title_ids: List[int] = []


class UnapplyPackageRequest(BaseModel):
    kid_profile_id: int


class UpdateActionRequest(BaseModel):
    action: str  # "accept" or "dismiss"


# --- Helper ---

def _serialize_package(pkg: ContentPackage, items: list = None) -> dict:
    return {
        "id": pkg.id,
        "name": pkg.name,
        "description": pkg.description,
        "age_min": pkg.age_min,
        "age_max": pkg.age_max,
        "category": pkg.category,
        "icon": pkg.icon,
        "is_active": pkg.is_active,
        "item_count": len(items) if items is not None else len(pkg.items) if pkg.items else 0,
        "created_at": pkg.created_at.isoformat() if pkg.created_at else None,
    }


def _serialize_title(title: Title) -> dict:
    return {
        "id": title.id,
        "tmdb_id": title.tmdb_id,
        "title": title.title,
        "media_type": title.media_type,
        "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
        "rating": title.rating,
        "genres": title.genres or [],
        "providers": title.providers or [],
    }


# =========================================================================
# Admin endpoints
# =========================================================================

@router.post("/admin", status_code=201)
def create_package(
    request: PackageCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    pkg = ContentPackage(
        name=request.name,
        description=request.description,
        age_min=request.age_min,
        age_max=request.age_max,
        category=request.category,
        icon=request.icon,
        created_by=current_user.id,
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return _serialize_package(pkg, [])


@router.put("/admin/{package_id}")
def update_package(
    package_id: int,
    request: PackageUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    pkg = db.query(ContentPackage).filter(ContentPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    for field in ("name", "description", "age_min", "age_max", "category", "icon", "is_active"):
        val = getattr(request, field)
        if val is not None:
            setattr(pkg, field, val)

    db.commit()
    db.refresh(pkg)
    return _serialize_package(pkg)


@router.delete("/admin/{package_id}")
def delete_package(
    package_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    pkg = db.query(ContentPackage).filter(ContentPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    pkg.is_active = False
    db.commit()
    return {"message": "Package deactivated"}


@router.post("/admin/{package_id}/items")
def add_items_to_package(
    package_id: int,
    request: AddItemsRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    pkg = db.query(ContentPackage).filter(ContentPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    added = 0
    for title_id in request.title_ids:
        title = db.query(Title).filter(Title.id == title_id).first()
        if not title:
            continue

        existing = db.query(ContentPackageItem).filter(
            ContentPackageItem.package_id == package_id,
            ContentPackageItem.title_id == title_id,
        ).first()
        if existing:
            continue

        db.add(ContentPackageItem(package_id=package_id, title_id=title_id))
        added += 1

        # Create PackageUpdate entries for profiles that already applied this package
        applied_profiles = db.query(AppliedPackage).filter(
            AppliedPackage.package_id == package_id
        ).all()

        for ap in applied_profiles:
            # Only notify if the profile doesn't already have a policy for this title
            existing_policy = db.query(Policy).filter(
                Policy.kid_profile_id == ap.kid_profile_id,
                Policy.title_id == title_id,
            ).first()
            if not existing_policy:
                db.add(PackageUpdate(
                    kid_profile_id=ap.kid_profile_id,
                    package_id=package_id,
                    title_id=title_id,
                ))

    db.commit()
    return {"message": f"Added {added} title(s) to package", "added": added}


@router.delete("/admin/{package_id}/items/{title_id}")
def remove_item_from_package(
    package_id: int,
    title_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = db.query(ContentPackageItem).filter(
        ContentPackageItem.package_id == package_id,
        ContentPackageItem.title_id == title_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in package")

    db.delete(item)
    db.commit()
    return {"message": "Title removed from package"}


@router.get("/admin/all")
def get_all_packages_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    packages = db.query(ContentPackage).order_by(ContentPackage.created_at.desc()).all()
    result = []
    for pkg in packages:
        data = _serialize_package(pkg)
        applied_count = db.query(AppliedPackage).filter(AppliedPackage.package_id == pkg.id).count()
        data["applied_count"] = applied_count
        result.append(data)
    return result


# =========================================================================
# Parent endpoints
# =========================================================================

@router.get("")
def list_packages(
    kid_age: Optional[int] = None,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """List all active packages, optionally filtered by a kid's age."""
    query = db.query(ContentPackage).filter(ContentPackage.is_active == True)

    if kid_age is not None:
        query = query.filter(
            (ContentPackage.age_min == None) | (ContentPackage.age_min <= kid_age),
            (ContentPackage.age_max == None) | (ContentPackage.age_max >= kid_age),
        )

    packages = query.order_by(ContentPackage.category, ContentPackage.name).all()
    return [_serialize_package(pkg) for pkg in packages]


@router.get("/{package_id}")
def get_package_detail(
    package_id: int,
    kid_profile_id: Optional[int] = None,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Get package detail with all titles. If kid_profile_id is given, include applied status."""
    pkg = db.query(ContentPackage).filter(ContentPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    items = (
        db.query(ContentPackageItem, Title)
        .join(Title, ContentPackageItem.title_id == Title.id)
        .filter(ContentPackageItem.package_id == package_id)
        .order_by(Title.title)
        .all()
    )

    result = _serialize_package(pkg, items)
    result["titles"] = [_serialize_title(title) for _, title in items]

    # Include applied status if a kid profile is specified
    if kid_profile_id:
        profile = db.query(KidProfile).filter(KidProfile.id == kid_profile_id).first()
        if profile and profile.parent_id == current_user.id:
            applied = db.query(AppliedPackage).filter(
                AppliedPackage.kid_profile_id == kid_profile_id,
                AppliedPackage.package_id == package_id,
            ).first()
            result["is_applied"] = applied is not None

            # Mark which titles already have policies
            existing_policies = db.query(Policy.title_id).filter(
                Policy.kid_profile_id == kid_profile_id,
                Policy.title_id.in_([t.id for _, t in items]),
            ).all()
            existing_title_ids = {p.title_id for p in existing_policies}

            for t in result["titles"]:
                t["has_policy"] = t["id"] in existing_title_ids

    return result


@router.post("/{package_id}/apply")
def apply_package(
    package_id: int,
    request: ApplyPackageRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Apply a package to a kid profile, creating policies for each title."""
    profile = db.query(KidProfile).filter(KidProfile.id == request.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only manage your own kid's profiles")

    pkg = db.query(ContentPackage).filter(
        ContentPackage.id == package_id,
        ContentPackage.is_active == True,
    ).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    # Check if already applied
    already = db.query(AppliedPackage).filter(
        AppliedPackage.kid_profile_id == request.kid_profile_id,
        AppliedPackage.package_id == package_id,
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="Package already applied to this profile")

    # Get all titles in package
    items = db.query(ContentPackageItem).filter(
        ContentPackageItem.package_id == package_id
    ).all()

    excluded = set(request.excluded_title_ids)
    policies_created = 0

    for item in items:
        if item.title_id in excluded:
            continue

        # Skip if policy already exists
        existing = db.query(Policy).filter(
            Policy.kid_profile_id == request.kid_profile_id,
            Policy.title_id == item.title_id,
        ).first()
        if existing:
            continue

        policy = Policy(
            kid_profile_id=request.kid_profile_id,
            title_id=item.title_id,
            is_allowed=True,
            source_package_id=package_id,
        )
        db.add(policy)
        policies_created += 1

    # Record the application
    db.add(AppliedPackage(
        kid_profile_id=request.kid_profile_id,
        package_id=package_id,
    ))
    db.commit()

    return {
        "message": f"Package '{pkg.name}' applied",
        "policies_created": policies_created,
        "titles_excluded": len(excluded),
    }


@router.post("/{package_id}/unapply")
def unapply_package(
    package_id: int,
    request: UnapplyPackageRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Remove all policies from this package for a kid profile."""
    profile = db.query(KidProfile).filter(KidProfile.id == request.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only manage your own kid's profiles")

    applied = db.query(AppliedPackage).filter(
        AppliedPackage.kid_profile_id == request.kid_profile_id,
        AppliedPackage.package_id == package_id,
    ).first()
    if not applied:
        raise HTTPException(status_code=404, detail="Package not applied to this profile")

    # Delete policies that came from this package
    deleted = db.query(Policy).filter(
        Policy.kid_profile_id == request.kid_profile_id,
        Policy.source_package_id == package_id,
    ).delete()

    # Remove any pending updates for this package/profile
    db.query(PackageUpdate).filter(
        PackageUpdate.kid_profile_id == request.kid_profile_id,
        PackageUpdate.package_id == package_id,
    ).delete()

    db.delete(applied)
    db.commit()

    return {"message": "Package removed", "policies_deleted": deleted}


@router.get("/updates/pending")
def get_pending_updates(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Get pending package updates (new titles added to applied packages)."""
    kid_ids = [p.id for p in db.query(KidProfile.id).filter(
        KidProfile.parent_id == current_user.id
    ).all()]

    if not kid_ids:
        return []

    updates = (
        db.query(PackageUpdate, ContentPackage, Title)
        .join(ContentPackage, PackageUpdate.package_id == ContentPackage.id)
        .join(Title, PackageUpdate.title_id == Title.id)
        .filter(
            PackageUpdate.kid_profile_id.in_(kid_ids),
            PackageUpdate.status == "pending",
        )
        .order_by(PackageUpdate.created_at.desc())
        .all()
    )

    return [
        {
            "id": upd.id,
            "kid_profile_id": upd.kid_profile_id,
            "package_id": upd.package_id,
            "package_name": pkg.name,
            "title": _serialize_title(title),
            "created_at": upd.created_at.isoformat() if upd.created_at else None,
        }
        for upd, pkg, title in updates
    ]


@router.post("/updates/{update_id}")
def handle_update(
    update_id: int,
    request: UpdateActionRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Accept or dismiss a package update."""
    upd = db.query(PackageUpdate).filter(PackageUpdate.id == update_id).first()
    if not upd:
        raise HTTPException(status_code=404, detail="Update not found")

    # Verify ownership
    profile = db.query(KidProfile).filter(KidProfile.id == upd.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")

    if request.action == "accept":
        # Create policy for the new title
        existing = db.query(Policy).filter(
            Policy.kid_profile_id == upd.kid_profile_id,
            Policy.title_id == upd.title_id,
        ).first()
        if not existing:
            db.add(Policy(
                kid_profile_id=upd.kid_profile_id,
                title_id=upd.title_id,
                is_allowed=True,
                source_package_id=upd.package_id,
            ))
        upd.status = "accepted"
    elif request.action == "dismiss":
        upd.status = "dismissed"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'dismiss'")

    db.commit()
    return {"message": f"Update {request.action}ed"}


@router.get("/applied/{kid_profile_id}")
def get_applied_packages(
    kid_profile_id: int,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Get all packages applied to a kid profile."""
    profile = db.query(KidProfile).filter(KidProfile.id == kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only view your own kid's packages")

    applied = (
        db.query(AppliedPackage, ContentPackage)
        .join(ContentPackage, AppliedPackage.package_id == ContentPackage.id)
        .filter(AppliedPackage.kid_profile_id == kid_profile_id)
        .all()
    )

    return [
        {
            **_serialize_package(pkg),
            "applied_at": ap.applied_at.isoformat() if ap.applied_at else None,
        }
        for ap, pkg in applied
    ]
