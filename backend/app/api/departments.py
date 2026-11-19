from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import Department, User, UserRole, Complaint, ComplaintStatus
from app.schemas.schemas import DepartmentCreate, DepartmentResponse, UserResponse
from app.api.deps import get_current_user, require_admin

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).order_by(Department.department_name.asc()).all()
    results = []
    for d in departments:
        active_count = db.query(func.count(Complaint.id)).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_([ComplaintStatus.PENDING.value, ComplaintStatus.IN_PROGRESS.value])
        ).scalar() or 0
        
        results.append(DepartmentResponse(
            id=d.id,
            department_name=d.department_name,
            description=d.description,
            contact_email=d.contact_email,
            created_at=d.created_at,
            active_complaints_count=active_count
        ))
    return results

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(Department).filter(Department.department_name == dept_in.department_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    dept = Department(
        department_name=dept_in.department_name,
        description=dept_in.description,
        contact_email=dept_in.contact_email
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentResponse(
        id=dept.id,
        department_name=dept.department_name,
        description=dept.description,
        contact_email=dept.contact_email,
        created_at=dept.created_at,
        active_complaints_count=0
    )

@router.get("/{id}/staff", response_model=List[UserResponse])
def get_department_staff(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    staff_members = db.query(User).filter(
        User.department_id == id,
        User.role == UserRole.STAFF.value
    ).all()
    
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            department_id=u.department_id,
            department_name=u.department.department_name if u.department else None,
            phone_number=u.phone_number,
            avatar_url=u.avatar_url,
            created_at=u.created_at
        ) for u in staff_members
    ]
