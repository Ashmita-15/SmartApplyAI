"""
Safe Apply Router — Autofill Payload Preparation

Endpoint: POST /ai/prepare-autofill
Builds a review-ready payload from user profile + job data.
The user reviews and edits everything before opening the external page.

Compliance:
  - Constraint 2: No auto-submission
  - Constraint 3: No external platform auth
  - Constraint 4: AI disclosure mandatory
  - Constraint 5: All generated text is editable
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from app.database import supabase_admin
from app.services.autofill_prep import build_autofill_payload
from app.services.writing import generate_cover_letter, generate_answer
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/ai", tags=["ai"])


class PrepareAutofillRequest(BaseModel):
    job_id: str
    resume_id: Optional[str] = None
    include_cover_letter: bool = True
    custom_questions: Optional[List[str]] = None


@router.post("/prepare-autofill")
async def prepare_autofill(data: PrepareAutofillRequest, request: Request):
    """
    Build a safe autofill payload for a job application.
    
    Flow: 
      1. Fetch user profile + job data
      2. Generate cover letter (if requested)
      3. Generate answers to detected questions
      4. Package into reviewable payload with AI disclosure
    
    The user reviews and edits everything before proceeding.
    """
    # Extract user from auth header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = auth_header.replace("Bearer ", "")
    try:
        from app.database import supabase
        user_result = supabase.auth.get_user(token)
        if not user_result or not user_result.user:
            raise Exception("No user found")
        user_id = str(user_result.user.id)
    except Exception as e:
        print("Auth error in prepare-autofill:", str(e))
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        # Fetch job
        job_res = supabase_admin.table("jobs").select("*").eq("id", data.job_id).single().execute()
        if not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = job_res.data

        # Fetch profile
        profile_res = supabase_admin.table("profiles").select("*").eq("user_id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Profile not found. Please complete your profile first.")
        profile = profile_res.data

        # Check minimum profile completeness
        missing_fields = []
        if not profile.get("full_name"):
            missing_fields.append("full_name")
        if not profile.get("skills") or len(profile.get("skills", [])) == 0:
            missing_fields.append("skills")

        if missing_fields:
            return {
                "error": "INCOMPLETE_PROFILE",
                "missing_fields": missing_fields,
                "minimum_required": ["full_name", "skills"],
                "user_message": f"Your profile is missing: {', '.join(missing_fields)}. Please update your profile before using Prepare Application.",
                "partial_results_available": False,
            }

        # Fetch resume text if resume_id provided
        if data.resume_id:
            resume_res = supabase_admin.table("resumes").select("*").eq("id", data.resume_id).single().execute()
            if resume_res.data:
                profile["resume_text"] = resume_res.data.get("raw_text", "")
                profile["resume_url"] = resume_res.data.get("file_url", "")

        # Get user's auth email
        user_res = supabase_admin.auth.admin.get_user_by_id(user_id)
        if user_res and user_res.user:
            profile["email"] = user_res.user.email

        # Generate cover letter
        cover_letter = ""
        if data.include_cover_letter:
            tone = profile.get("cover_letter_tone", "professional")
            cover_letter = generate_cover_letter(profile, job, tone)

        # Generate answers for detected questions
        answers = []
        questions = data.custom_questions or []
        
        # Add job's detected questions
        detected = job.get("detected_questions", [])
        if isinstance(detected, list):
            questions.extend(detected)

        # Add platform-specific common questions
        platform = (job.get("platform") or "").lower()
        if platform == "internshala":
            if "Why should you be hired for this role?" not in questions:
                questions.append("Why should you be hired for this role?")

        for q in questions:
            if q and q.strip():
                ans = generate_answer(q.strip(), profile)
                answers.append(ans)

        # Build final payload
        result = build_autofill_payload(
            profile=profile,
            job=job,
            cover_letter=cover_letter,
            answers=answers,
        )

        # Save to history
        try:
            supabase_admin.table("autofill_history").insert({
                "user_id": user_id,
                "job_id": data.job_id,
                "payload": result["autofill_payload"],
                "quality_report": result["quality_report"],
                "platform_notes": result["platform_notes"],
            }).execute()
        except Exception:
            pass  # Non-critical

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
