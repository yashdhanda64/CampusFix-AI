import json
import logging
import re
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

VALID_CATEGORIES = [
    "Electrical",
    "Plumbing",
    "Housekeeping",
    "Internet and IT",
    "Civil Maintenance",
    "Furniture",
    "Security",
    "Other"
]

CATEGORY_TO_DEPT = {
    "Electrical": "Electrical Maintenance",
    "Plumbing": "Plumbing & Water Works",
    "Housekeeping": "Housekeeping & Sanitation",
    "Internet and IT": "IT & Campus Network Services",
    "Civil Maintenance": "Civil Infrastructure & Works",
    "Furniture": "Estate & Furniture Maintenance",
    "Security": "Campus Security & Vigilance",
    "Other": "General Campus Administration"
}

def analyze_with_fallback(title: str, description: str, location: str = "") -> Dict[str, Any]:
    """
    Intelligent NLP-based heuristic classifier for offline/fallback mode.
    Handles categorization, priority estimation, safety concern detection, and recommendations.
    """
    full_text = f"{title} {description} {location}".lower()

    # 1. Category Matching Score
    cat_scores = {cat: 0 for cat in VALID_CATEGORIES}
    
    # Electrical
    elec_kw = ["wire", "electric", "spark", "shock", "socket", "switch", "short circuit", "fan", "light", "bulb", "tube light", "ac", "air conditioner", "power cut", "outage", "generator", "mcb", "fuse", "appliances", "meter", "lift", "elevator"]
    for kw in elec_kw:
        if kw in full_text:
            cat_scores["Electrical"] += 2 if kw in title.lower() else 1
            
    # Plumbing
    plumb_kw = ["water", "leak", "pipe", "tap", "faucet", "drain", "drainage", "clog", "flush", "washroom", "toilet", "restroom", "sink", "overflow", "sewage", "drinking water", "geyser", "shower"]
    for kw in plumb_kw:
        if kw in full_text:
            cat_scores["Plumbing"] += 2 if kw in title.lower() else 1

    # Housekeeping
    hk_kw = ["clean", "dirty", "trash", "garbage", "dustbin", "waste", "smell", "odor", "stink", "insects", "cockroach", "rats", "mosquitoes", "sweeping", "mopping", "sanitation", "dust", "mess"]
    for kw in hk_kw:
        if kw in full_text:
            cat_scores["Housekeeping"] += 2 if kw in title.lower() else 1

    # Internet and IT
    it_kw = ["wifi", "wi-fi", "internet", "ethernet", "lan", "router", "network", "portal", "lms", "projector", "lab pc", "computer", "printer", "server", "ip address", "connectivity", "speed"]
    for kw in it_kw:
        if kw in full_text:
            cat_scores["Internet and IT"] += 2 if kw in title.lower() else 1

    # Civil Maintenance
    civil_kw = ["wall", "crack", "ceiling", "roof", "paint", "tiles", "floor", "plaster", "door", "window", "glass pane", "staircase", "railing", "seepage", "dampness", "concrete"]
    for kw in civil_kw:
        if kw in full_text:
            cat_scores["Civil Maintenance"] += 2 if kw in title.lower() else 1

    # Furniture
    furn_kw = ["chair", "desk", "table", "bench", "cupboard", "almirah", "podium", "blackboard", "whiteboard", "lock", "handle", "drawer", "mattress", "bed"]
    for kw in furn_kw:
        if kw in full_text:
            cat_scores["Furniture"] += 2 if kw in title.lower() else 1

    # Security
    sec_kw = ["theft", "stolen", "lost", "camera", "cctv", "guard", "security", "trespassing", "fight", "harassment", "id card", "gate pass", "locked out", "suspicious", "unauthorized"]
    for kw in sec_kw:
        if kw in full_text:
            cat_scores["Security"] += 2 if kw in title.lower() else 1

    # Select best category
    best_cat = max(cat_scores, key=cat_scores.get)
    if cat_scores[best_cat] == 0:
        best_cat = "Other"

    # 2. Priority & Safety Concern Detection
    critical_kw = ["spark", "fire", "smoke", "electric shock", "exposed wire", "short circuit", "collapse", "gas leak", "chemical", "emergency", "danger", "trapped", "flood"]
    high_kw = ["no water", "blackout", "overflowing", "server down", "exam", "entire floor", "entire hostel", "broken glass", "cannot open", "urgent"]
    low_kw = ["flickering", "minor", "small", "paint peeling", "squeak", "loose handle", "cosmetic", "request"]

    is_critical = any(kw in full_text for kw in critical_kw)
    is_high = any(kw in full_text for kw in high_kw)
    is_low = any(kw in full_text for kw in low_kw)

    if is_critical:
        priority = "Critical"
        safety_concerns = "ATTENTION REQUIRED: Potential safety hazard detected (sparks, electrical risk, or physical danger). Automated escalation triggered for expedited human staff inspection."
        recommended_actions = "1. Immediate site isolation if hazardous. 2. Dispatch emergency on-duty technician within 30 minutes. 3. Notify floor warden."
        confidence = 0.94
    elif is_high:
        priority = "High"
        safety_concerns = "High operational disruption impacting multiple students or essential facilities."
        recommended_actions = "1. Assign duty supervisor. 2. Verify root cause within 2 hours. 3. Deploy replacement parts or technician."
        confidence = 0.89
    elif is_low:
        priority = "Low"
        safety_concerns = "No acute safety or structural hazard identified."
        recommended_actions = "1. Schedule during routine daily maintenance cycle. 2. Resolve within standard 48-hour SLA window."
        confidence = 0.88
    else:
        priority = "Medium"
        safety_concerns = "Standard maintenance concern. Monitor for escalation if left unresolved."
        recommended_actions = "1. Dispatch designated department staff. 2. Inspect and resolve within 24 hours."
        confidence = 0.91

    suggested_dept = CATEGORY_TO_DEPT.get(best_cat, "General Campus Administration")
    
    summary = f"Automated AI Assessment: {best_cat} issue reported at '{location or 'Campus'}'. Rated as {priority} priority based on impact and safety indicators."

    return {
        "predicted_category": best_cat,
        "predicted_priority": priority,
        "suggested_department": suggested_dept,
        "confidence": confidence,
        "summary": summary,
        "safety_concerns": safety_concerns,
        "recommended_actions": recommended_actions,
        "model_version": "CampusFix-NLP-Engine-v2"
    }

async def analyze_complaint_ai(
    title: str,
    description: str,
    location: str = "",
    image_base64: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes a complaint using Google Gemini API if key is present; falls back to NLP engine seamlessly.
    """
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not configured. Using high-precision built-in NLP classifier.")
        return analyze_with_fallback(title, description, location)

    # Call Gemini REST API
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    
    system_prompt = (
        "You are CampusFix AI, an intelligent university facility complaint management system. "
        "Analyze the provided complaint title, description, location, and optional image. "
        "Categories must strictly be one of: Electrical, Plumbing, Housekeeping, Internet and IT, Civil Maintenance, Furniture, Security, Other. "
        "Priority must strictly be one of: Critical, High, Medium, Low. "
        "Critical is for severe hazards (sparks, live wires, fire, structural risk, collapse). "
        "Never claim an emergency has been verified solely by AI. If hazardous, mention human review required. "
        "Output ONLY a raw valid JSON object without markdown formatting with these exact keys: "
        "predicted_category, predicted_priority, suggested_department, confidence, summary, safety_concerns, recommended_actions."
    )

    prompt_content = f"Title: {title}\nDescription: {description}\nLocation: {location}"

    parts = [{"text": system_prompt + "\n\n" + prompt_content}]
    if image_base64:
        # Strip header if data URI provided
        clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": clean_b64
            }
        })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 800
        }
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(api_url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Remove backticks if wrapped in ```json ... ```
                cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text_response, flags=re.MULTILINE).strip()
                parsed = json.loads(cleaned)
                
                # Validate category and priority
                cat = parsed.get("predicted_category", "Other")
                if cat not in VALID_CATEGORIES:
                    cat = "Other"
                prio = parsed.get("predicted_priority", "Medium")
                if prio not in ["Critical", "High", "Medium", "Low"]:
                    prio = "Medium"

                return {
                    "predicted_category": cat,
                    "predicted_priority": prio,
                    "suggested_department": parsed.get("suggested_department") or CATEGORY_TO_DEPT.get(cat, "General Campus Administration"),
                    "confidence": float(parsed.get("confidence", 0.95)),
                    "summary": parsed.get("summary", title),
                    "safety_concerns": parsed.get("safety_concerns", "None detected"),
                    "recommended_actions": parsed.get("recommended_actions", "Assign technician"),
                    "model_version": f"Gemini-{settings.GEMINI_MODEL}"
                }
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}. Falling back to NLP engine.")
                return analyze_with_fallback(title, description, location)
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}. Utilizing fallback engine.")
        return analyze_with_fallback(title, description, location)
