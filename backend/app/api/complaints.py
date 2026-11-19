from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database.session import get_db
from app.models.models import (
    Complaint,
    ComplaintUpdate,
    AIAnalysis,
    DuplicateMatch,
    Notification,
    User,
    UserRole,
    Department,
    Building,
    ComplaintStatus,
    ComplaintPriority
)
from app.schemas.schemas import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintUpdateStatus,
    ComplaintAssignRequest,
    ComplaintUpdateTimeline,
    AIAnalysisResponse,
    FeedbackResponse,
    DuplicateMatchItem
)
from app.api.deps import get_current_user, require_admin, require_staff_or_admin
from app.ai.gemini_service import analyze_complaint_ai, CATEGORY_TO_DEPT
from app.services.duplicate_service import check_for_duplicates
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def calculate_sla_deadline(priority: str) -> datetime:
    now = datetime.now(timezone.utc)
    p = (priority or "Medium").upper()
    if p == "CRITICAL":
        return now + timedelta(hours=4)
    elif p == "HIGH":
        return now + timedelta(hours=24)
    elif p == "MEDIUM":
        return now + timedelta(hours=48)
    else:
        return now + timedelta(hours=72)

def format_complaint_response(c: Complaint) -> ComplaintResponse:
    now = datetime.now(timezone.utc)
    is_violated = False
    if c.sla_deadline and c.status not in [ComplaintStatus.RESOLVED.value, ComplaintStatus.REJECTED.value]:
        # Handle timezone aware vs naive comparisons safely
        deadline = c.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if now > deadline:
            is_violated = True

    ai_resp = None
    if c.ai_analysis:
        ai_resp = AIAnalysisResponse(
            id=c.ai_analysis.id,
            complaint_id=c.ai_analysis.complaint_id,
            predicted_category=c.ai_analysis.predicted_category,
            predicted_priority=c.ai_analysis.predicted_priority,
            suggested_department=c.ai_analysis.suggested_department,
            confidence=c.ai_analysis.confidence,
            summary=c.ai_analysis.summary,
            safety_concerns=c.ai_analysis.safety_concerns,
            recommended_actions=c.ai_analysis.recommended_actions,
            model_version=c.ai_analysis.model_version,
            created_at=c.ai_analysis.created_at
        )

    fb_resp = None
    if c.feedback:
        fb_resp = FeedbackResponse(
            id=c.feedback.id,
            complaint_id=c.feedback.complaint_id,
            student_id=c.feedback.student_id,
            student_name=c.feedback.student.name if c.feedback.student else None,
            rating=c.feedback.rating,
            comment=c.feedback.comment,
            created_at=c.feedback.created_at
        )

    return ComplaintResponse(
        id=c.id,
        title=c.title,
        description=c.description,
        category=c.category,
        priority=c.priority,
        status=c.status,
        location=c.location,
        latitude=c.latitude,
        longitude=c.longitude,
        building_id=c.building_id,
        building_name=c.building.building_name if c.building else None,
        department_id=c.department_id,
        department_name=c.department.department_name if c.department else None,
        student_id=c.student_id,
        student_name=c.student.name if c.student else None,
        student_email=c.student.email if c.student else None,
        assigned_staff_id=c.assigned_staff_id,
        assigned_staff_name=c.assigned_staff.name if c.assigned_staff else None,
        image_url=c.image_url,
        audio_url=c.audio_url,
        ai_summary=c.ai_summary,
        resolution_notes=c.resolution_notes,
        resolution_image_url=c.resolution_image_url,
        sla_deadline=c.sla_deadline,
        is_sla_violated=is_violated,
        created_at=c.created_at,
        updated_at=c.updated_at,
        resolved_at=c.resolved_at,
        ai_analysis=ai_resp,
        feedback=fb_resp,
        updates_count=len(c.updates) if c.updates else 0
    )

@router.post("", response_model=ComplaintDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify building exists
    building = db.query(Building).filter(Building.id == complaint_in.building_id).first()
    if not building:
        raise HTTPException(status_code=400, detail="Invalid campus building selected.")

    # 1. Run AI Analysis
    ai_result = await analyze_complaint_ai(
        title=complaint_in.title,
        description=complaint_in.description,
        location=f"{building.building_name} - {complaint_in.location}"
    )

    final_category = complaint_in.category or ai_result["predicted_category"]
    final_priority = complaint_in.priority or ai_result["predicted_priority"]
    ai_summary = ai_result["summary"]

    # 2. Match department
    dept_name = ai_result.get("suggested_department") or CATEGORY_TO_DEPT.get(final_category)
    dept = None
    if dept_name:
        dept = db.query(Department).filter(Department.department_name.ilike(f"%{dept_name}%")).first()
        if not dept:
            # Fallback keyword match
            dept = db.query(Department).first()

    # 3. Calculate SLA deadline
    sla_time = calculate_sla_deadline(final_priority)

    # 4. Create Complaint
    new_complaint = Complaint(
        title=complaint_in.title.strip(),
        description=complaint_in.description.strip(),
        category=final_category,
        priority=final_priority,
        status=ComplaintStatus.PENDING.value,
        location=complaint_in.location.strip(),
        latitude=complaint_in.latitude or building.latitude,
        longitude=complaint_in.longitude or building.longitude,
        building_id=building.id,
        department_id=dept.id if dept else None,
        student_id=current_user.id,
        image_url=complaint_in.image_url,
        audio_url=complaint_in.audio_url,
        ai_summary=ai_summary,
        sla_deadline=sla_time
    )
    db.add(new_complaint)
    db.flush()

    # 5. Persist AI Analysis
    ai_record = AIAnalysis(
        complaint_id=new_complaint.id,
        predicted_category=ai_result["predicted_category"],
        predicted_priority=ai_result["predicted_priority"],
        suggested_department=ai_result.get("suggested_department"),
        confidence=ai_result["confidence"],
        summary=ai_result["summary"],
        safety_concerns=ai_result.get("safety_concerns"),
        recommended_actions=ai_result.get("recommended_actions"),
        model_version=ai_result.get("model_version", "gemini-1.5-flash")
    )
    db.add(ai_record)

    # 6. Check duplicates & persist matches
    _, _, raw_matches = check_for_duplicates(
        db=db,
        title=new_complaint.title,
        description=new_complaint.description,
        building_id=building.id,
        category=final_category,
        exclude_id=new_complaint.id
    )
    for m in raw_matches[:3]: # top 3 matches
        dup = DuplicateMatch(
            complaint_id=new_complaint.id,
            matched_complaint_id=m["complaint_id"],
            similarity_score=m["similarity_score"],
            reason=m["reason"]
        )
        db.add(dup)

    # 7. Timeline initial entry
    initial_update = ComplaintUpdate(
        complaint_id=new_complaint.id,
        actor_id=current_user.id,
        old_status=None,
        new_status=ComplaintStatus.PENDING.value,
        note=f"Complaint filed by {current_user.name}. AI routed to {dept.department_name if dept else 'Administration'} with {final_priority} priority."
    )
    db.add(initial_update)

    # 8. Notification to student
    notif = Notification(
        user_id=current_user.id,
        title="Complaint Registered Successfully",
        message=f"Your ticket '{new_complaint.title}' has been routed to {dept.department_name if dept else 'Facilities'}.",
        link=f"/complaints/{new_complaint.id}"
    )
    db.add(notif)

    # If critical, send alert notification to admin
    if final_priority == "Critical":
        admins = db.query(User).filter(User.role == UserRole.ADMIN.value).all()
        for a in admins:
            db.add(Notification(
                user_id=a.id,
                title="CRITICAL COMPLAINT ALERT",
                message=f"Critical issue logged at {building.building_name}: {new_complaint.title}. Safety concerns flagged by AI.",
                link=f"/complaints/{new_complaint.id}"
            ))

    db.commit()
    db.refresh(new_complaint)

    # Broadcast event via WebSocket
    await ws_manager.broadcast({
        "event": "NEW_COMPLAINT",
        "complaint_id": new_complaint.id,
        "title": new_complaint.title,
        "priority": new_complaint.priority,
        "building": building.building_name,
        "category": new_complaint.category
    })

    return get_complaint_detail(new_complaint.id, db, current_user)

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    building_id: Optional[int] = None,
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    my_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Complaint)

    # Role-based scoping
    if current_user.role == UserRole.STUDENT.value and my_only:
        query = query.filter(Complaint.student_id == current_user.id)
    elif current_user.role == UserRole.STAFF.value:
        if current_user.department_id:
            query = query.filter(Complaint.department_id == current_user.department_id)

    # Filters
    if category and category != "All":
        query = query.filter(Complaint.category == category)
    if priority and priority != "All":
        query = query.filter(Complaint.priority == priority)
    if status and status != "All":
        query = query.filter(Complaint.status == status)
    if building_id:
        query = query.filter(Complaint.building_id == building_id)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(search_filter),
                Complaint.description.ilike(search_filter),
                Complaint.location.ilike(search_filter)
            )
        )

    complaints = query.order_by(desc(Complaint.created_at)).all()
    return [format_complaint_response(c) for c in complaints]

@router.get("/{id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    base = format_complaint_response(complaint)

    # Timeline updates
    timeline = []
    for u in complaint.updates:
        timeline.append(ComplaintUpdateTimeline(
            id=u.id,
            actor_id=u.actor_id,
            actor_name=u.actor.name if u.actor else "System",
            actor_role=u.actor.role if u.actor else None,
            old_status=u.old_status,
            new_status=u.new_status,
            note=u.note,
            created_at=u.created_at
        ))

    # Duplicates
    dup_items = []
    for d in complaint.duplicate_matches:
        if d.matched_complaint:
            dup_items.append(DuplicateMatchItem(
                complaint_id=d.matched_complaint_id,
                title=d.matched_complaint.title,
                status=d.matched_complaint.status,
                priority=d.matched_complaint.priority,
                similarity_score=d.similarity_score,
                reason=d.reason or "High text similarity",
                created_at=d.matched_complaint.created_at
            ))

    return ComplaintDetailResponse(
        **base.model_dump(),
        updates=timeline,
        duplicate_matches=dup_items
    )

@router.patch("/{id}/status", response_model=ComplaintDetailResponse)
async def update_complaint_status(
    id: int,
    status_in: ComplaintUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Authorization: Students can only REOPEN their own resolved complaints
    if current_user.role == UserRole.STUDENT.value:
        if complaint.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only manage your own complaints.")
        if status_in.status != ComplaintStatus.REOPENED.value:
            raise HTTPException(status_code=403, detail="Students can only reopen unresolved complaints.")
    
    old_status = complaint.status
    complaint.status = status_in.status
    
    if status_in.resolution_notes:
        complaint.resolution_notes = status_in.resolution_notes
    if status_in.resolution_image_url:
        complaint.resolution_image_url = status_in.resolution_image_url

    if status_in.status == ComplaintStatus.RESOLVED.value:
        complaint.resolved_at = datetime.now(timezone.utc)
    elif status_in.status == ComplaintStatus.REOPENED.value:
        complaint.resolved_at = None

    # Add audit timeline entry
    note = status_in.note or f"Status updated to {status_in.status} by {current_user.name}"
    update_entry = ComplaintUpdate(
        complaint_id=complaint.id,
        actor_id=current_user.id,
        old_status=old_status,
        new_status=status_in.status,
        note=note
    )
    db.add(update_entry)

    # Notify student
    db.add(Notification(
        user_id=complaint.student_id,
        title=f"Complaint Status: {status_in.status}",
        message=f"Your complaint '{complaint.title}' has been updated to {status_in.status}. {note}",
        link=f"/complaints/{complaint.id}"
    ))

    db.commit()
    db.refresh(complaint)

    # Broadcast event
    await ws_manager.broadcast({
        "event": "STATUS_UPDATED",
        "complaint_id": complaint.id,
        "status": complaint.status,
        "title": complaint.title
    })

    return get_complaint_detail(complaint.id, db, current_user)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Only Admin or creator while pending can delete
    if current_user.role != UserRole.ADMIN.value:
        if complaint.student_id != current_user.id or complaint.status != ComplaintStatus.PENDING.value:
            raise HTTPException(status_code=403, detail="Cannot delete complaints after processing begins.")

    db.delete(complaint)
    db.commit()
    return None
