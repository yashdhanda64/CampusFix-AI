from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import aiofiles
from app.database.session import get_db
from app.core.config import settings
from app.ai.gemini_service import analyze_complaint_ai
from app.services.duplicate_service import check_for_duplicates
from app.schemas.schemas import (
    AIAnalyzeRequest,
    AIAnalysisResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    DuplicateMatchItem
)
from app.models.models import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Engine"])

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_complaint(
    req: AIAnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Performs AI analysis using Gemini (or fallback NLP engine)
    to predict category, priority, safety concerns, and action items.
    """
    analysis = await analyze_complaint_ai(
        title=req.title,
        description=req.description,
        location=req.location or "",
        image_base64=req.image_base64
    )
    return AIAnalysisResponse(**analysis)

@router.post("/detect-duplicates", response_model=DuplicateCheckResponse)
def detect_duplicates(
    req: DuplicateCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Identifies potential duplicate complaints based on text similarity,
    campus building, category, and recent activity.
    """
    is_suspected, top_score, raw_matches = check_for_duplicates(
        db=db,
        title=req.title,
        description=req.description,
        building_id=req.building_id,
        category=req.category
    )

    matches = [
        DuplicateMatchItem(
            complaint_id=m["complaint_id"],
            title=m["title"],
            status=m["status"],
            priority=m["priority"],
            similarity_score=m["similarity_score"],
            reason=m["reason"],
            created_at=m["created_at"]
        ) for m in raw_matches
    ]

    return DuplicateCheckResponse(
        is_duplicate_suspected=is_suspected,
        confidence_score=top_score,
        matches=matches
    )

@router.post("/upload-media")
async def upload_complaint_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads an image or recorded audio file and returns its public URL path.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit")

    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    return {
        "filename": unique_name,
        "url": f"/uploads/{unique_name}",
        "content_type": file.content_type
    }
