from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from db import get_db
from models import User, StreamingServiceSelection
from auth_utils import require_parent

router = APIRouter(prefix="/services", tags=["services"])

AVAILABLE_SERVICES = [
    {"id": "netflix", "name": "Netflix", "package": "com.netflix.mediaclient"},
    {"id": "disney_plus", "name": "Disney+", "package": "com.disney.disneyplus"},
    {"id": "hulu", "name": "Hulu", "package": "com.hulu.plus"},
    {"id": "prime_video", "name": "Prime Video", "package": "com.amazon.avod.thirdpartyclient"},
    {"id": "max", "name": "Max", "package": "com.hbo.hbonow"},
    {"id": "peacock", "name": "Peacock", "package": "com.peacocktv.peacockandroid"},
    {"id": "youtube", "name": "YouTube", "package": "com.google.android.youtube"}
]

class ServiceSelectionUpdate(BaseModel):
    selected_services: List[str]

@router.get("")
async def get_selected_services(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    """
    Get the streaming services selected by the family
    """
    selection = db.query(StreamingServiceSelection).filter(
        StreamingServiceSelection.family_id == current_user.id
    ).first()
    
    if not selection:
        return {
            "available_services": AVAILABLE_SERVICES,
            "selected_services": []
        }
    
    return {
        "available_services": AVAILABLE_SERVICES,
        "selected_services": selection.selected_services or []
    }

@router.post("")
async def update_selected_services(
    data: ServiceSelectionUpdate,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    """
    Update the streaming services selected by the family
    """
    valid_service_ids = {service["id"] for service in AVAILABLE_SERVICES}
    
    for service_id in data.selected_services:
        if service_id not in valid_service_ids:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid service ID: {service_id}"
            )
    
    selection = db.query(StreamingServiceSelection).filter(
        StreamingServiceSelection.family_id == current_user.id
    ).first()
    
    if not selection:
        selection = StreamingServiceSelection(
            family_id=current_user.id,
            selected_services=data.selected_services
        )
        db.add(selection)
    else:
        selection.selected_services = data.selected_services
    
    db.commit()
    db.refresh(selection)
    
    return {
        "message": "Services updated successfully",
        "selected_services": selection.selected_services
    }
