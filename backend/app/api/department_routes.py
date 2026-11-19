from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.session import get_db
from app.models.models import (
    Complaint,
    ComplaintStatus,
    ComplaintPriority,
    User,
    UserRole,
    Department
)
from app.schemas.schemas import (
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintUpdateStatus,
    DepartmentPerformance
)
from app.api.deps import require_staff_or_admin, get_current_user
from app.api.complaints import format_complaint_response, get_complaint_detail, update_complaint_status

router = APIRouter(prefix="/department", tags=["Department Staff Portal"])

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_department_complaints(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    my_assigned: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    query = db.query(Complaint)
    
    # Filter by user's department if staff
    if current_user.role == UserRole.STAFF.value:
        if current_user.department_id:
            query = query.filter(Complaint.department_id == current_user.department_id)
        if my_assigned:
            query = query.filter(Complaint.assigned_staff_id == current_user.id)

    if category and category != "All":
        query = query.filter(Complaint.category == category)
    if priority and priority != "All":
        query = query.filter(Complaint.priority == priority)
    if status and status != "All":
        query = query.filter(Complaint.status == status)

    complaints = query.order_by(desc(Complaint.created_at)).all()
    return [format_complaint_response(c) for c in complaints]

@router.patch("/complaints/{id}/status", response_model=ComplaintDetailResponse)
async def department_update_status(
    id: int,
    status_in: ComplaintUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    return await update_complaint_status(id, status_in, db, current_user)

@router.get("/performance", response_model=DepartmentPerformance)
def get_department_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    dept_id = current_user.department_id
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    
    dept_name = dept.department_name if dept else "All Facilities"
    
    query = db.query(Complaint)
    if dept_id:
        query = query.filter(Complaint.department_id == dept_id)
        
    total_assigned = query.count()
    resolved = query.filter(Complaint.status == ComplaintStatus.RESOLVED.value).count()
    pending = query.filter(Complaint.status.in_([ComplaintStatus.PENDING.value, ComplaintStatus.IN_PROGRESS.value])).count()

    # Calculate SLA violations
    now = datetime.now(timezone.utc)
    sla_violations = 0
    resolved_hours_sum = 0
    resolved_count = 0

    all_dept_complaints = query.all()
    for c in all_dept_complaints:
        if c.sla_deadline and c.status not in [ComplaintStatus.RESOLVED.value, ComplaintStatus.REJECTED.value]:
            dl = c.sla_deadline.replace(tzinfo=timezone.utc) if c.sla_deadline.tzinfo is None else c.sla_deadline
            if now > dl:
                sla_violations += 1

        if c.resolved_at and c.created_at:
            res_t = c.resolved_at.replace(tzinfo=timezone.utc) if c.resolved_at.tzinfo is None else c.resolved_at
            cre_t = c.created_at.replace(tzinfo=timezone.utc) if c.created_at.tzinfo is None else c.created_at
            hours = (res_t - cre_t).total_seconds() / 3600.0
            if hours > 0:
                resolved_hours_sum += hours
                resolved_count += 1

    avg_hours = round(resolved_hours_sum / resolved_count, 1) if resolved_count > 0 else 14.5

    return DepartmentPerformance(
        department_id=dept_id or 0,
        department_name=dept_name,
        total_assigned=total_assigned,
        resolved=resolved,
        pending=pending,
        avg_hours=avg_hours,
        sla_violations=sla_violations
    )
