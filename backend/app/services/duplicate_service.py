import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from difflib import SequenceMatcher
from app.models.models import Complaint, ComplaintStatus

def clean_text(text: str) -> str:
    """Normalize text for comparison: lowercase, alphanumeric and spaces only."""
    text = (text or "").lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return " ".join(text.split())

def word_tokens(text: str) -> set:
    stop_words = {"the", "a", "an", "is", "in", "at", "of", "on", "for", "and", "or", "to", "with", "from", "by", "not", "this", "that", "it"}
    words = clean_text(text).split()
    return {w for w in words if len(w) > 2 and w not in stop_words}

def compute_text_similarity(title1: str, desc1: str, title2: str, desc2: str) -> float:
    # Title SequenceMatcher
    title_seq_ratio = SequenceMatcher(None, clean_text(title1), clean_text(title2)).ratio()

    # Jaccard word similarity on combined text
    tokens1 = word_tokens(f"{title1} {desc1}")
    tokens2 = word_tokens(f"{title2} {desc2}")
    
    if not tokens1 or not tokens2:
        return title_seq_ratio

    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    jaccard = intersection / union if union > 0 else 0.0

    # Weighted blend: Title similarity is heavily weighted
    return (title_seq_ratio * 0.6) + (jaccard * 0.4)

def check_for_duplicates(
    db: Session,
    title: str,
    description: str,
    building_id: int,
    category: str = None,
    exclude_id: int = None,
    days_window: int = 14
) -> Tuple[bool, float, List[Dict[str, Any]]]:
    """
    Checks the database for existing similar complaints in the given building / category.
    Returns: (is_duplicate_suspected, max_similarity_score, matches_list)
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days_window)

    query = db.query(Complaint).filter(
        Complaint.created_at >= cutoff,
        Complaint.status.in_([ComplaintStatus.PENDING.value, ComplaintStatus.IN_PROGRESS.value])
    )

    if exclude_id:
        query = query.filter(Complaint.id != exclude_id)

    candidates = query.all()
    matches = []

    for c in candidates:
        same_building = (c.building_id == building_id)
        same_category = bool(category and c.category and c.category.lower() == category.lower())
        
        # Calculate raw text similarity (0.0 to 1.0)
        text_sim = compute_text_similarity(title, description, c.title, c.description)
        
        # Calculate composite score
        score = text_sim * 0.65
        
        reasons = []
        if same_building:
            score += 0.20
            reasons.append("same campus building")
        if same_category:
            score += 0.15
            reasons.append("matching category")

        score = min(round(score, 2), 0.99)

        # If similarity exceeds threshold
        if score >= 0.50:
            reasons.append(f"{int(text_sim * 100)}% content similarity")
            reason_str = "High match: " + ", ".join(reasons)
            matches.append({
                "complaint_id": c.id,
                "title": c.title,
                "status": c.status,
                "priority": c.priority,
                "similarity_score": score,
                "reason": reason_str,
                "created_at": c.created_at
            })

    # Sort descending by similarity
    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    is_suspected = len(matches) > 0
    top_score = matches[0]["similarity_score"] if matches else 0.0

    return is_suspected, top_score, matches
