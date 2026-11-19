from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Building, User
from app.schemas.schemas import BuildingCreate, BuildingResponse
from app.api.deps import get_current_user, require_admin

router = APIRouter(prefix="/buildings", tags=["Campus Buildings"])

@router.get("", response_model=List[BuildingResponse])
def get_buildings(db: Session = Depends(get_db)):
    buildings = db.query(Building).order_by(Building.building_name.asc()).all()
    return buildings

@router.post("", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED)
def create_building(
    building_in: BuildingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(Building).filter(Building.building_name == building_in.building_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Building with this name already exists")
    
    building = Building(
        building_name=building_in.building_name,
        block_code=building_in.block_code,
        latitude=building_in.latitude,
        longitude=building_in.longitude,
        description=building_in.description
    )
    db.add(building)
    db.commit()
    db.refresh(building)
    return building

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_building(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    building = db.query(Building).filter(Building.id == id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    db.delete(building)
    db.commit()
    return None
