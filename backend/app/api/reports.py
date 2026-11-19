import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Complaint, User
from app.api.deps import require_admin

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/export")
def export_complaints_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()

    if format.lower() == "json":
        data = [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "category": c.category,
                "priority": c.priority,
                "status": c.status,
                "building": c.building.building_name if c.building else "",
                "location": c.location,
                "department": c.department.department_name if c.department else "",
                "student_name": c.student.name if c.student else "",
                "assigned_staff": c.assigned_staff.name if c.assigned_staff else "",
                "created_at": c.created_at.isoformat() if c.created_at else "",
                "resolved_at": c.resolved_at.isoformat() if c.resolved_at else "",
                "resolution_notes": c.resolution_notes or ""
            }
            for c in complaints
        ]
        return data

    # Default CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Complaint ID",
        "Title",
        "Category",
        "Priority",
        "Status",
        "Building",
        "Location Detail",
        "Department",
        "Student Name",
        "Assigned Staff",
        "Created At",
        "Resolved At",
        "Resolution Notes"
    ])

    for c in complaints:
        writer.writerow([
            c.id,
            c.title,
            c.category,
            c.priority,
            c.status,
            c.building.building_name if c.building else "N/A",
            c.location,
            c.department.department_name if c.department else "Unassigned",
            c.student.name if c.student else "Unknown",
            c.assigned_staff.name if c.assigned_staff else "Unassigned",
            c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "",
            c.resolved_at.strftime("%Y-%m-%d %H:%M") if c.resolved_at else "",
            c.resolution_notes or ""
        ])

    csv_content = output.getvalue()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"campusfix_report_{timestamp}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
