from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Feedback, Complaint, ComplaintStatus, User, UserRole
from app.schemas.schemas import FeedbackCreate, FeedbackResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/feedback", tags=["Complaint Resolution Feedback"])

@router.post("/{complaint_id}", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    complaint_id: int,
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.student_id != current_user.id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="You can only submit feedback for your own complaints.")

    # Check existing feedback
    existing = db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first()
    if existing:
        existing.rating = feedback_in.rating
        existing.comment = feedback_in.comment
        db.commit()
        db.refresh(existing)
        return FeedbackResponse(
            id=existing.id,
            complaint_id=existing.complaint_id,
            student_id=existing.student_id,
            student_name=current_user.name,
            rating=existing.rating,
            comment=existing.comment,
            created_at=existing.created_at
        )

    new_feedback = Feedback(
        complaint_id=complaint_id,
        student_id=current_user.id,
        rating=feedback_in.rating,
        comment=feedback_in.comment
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return FeedbackResponse(
        id=new_feedback.id,
        complaint_id=new_feedback.complaint_id,
        student_id=new_feedback.student_id,
        student_name=current_user.name,
        rating=new_feedback.rating,
        comment=new_feedback.comment,
        created_at=new_feedback.created_at
    )
