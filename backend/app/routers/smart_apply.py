"""
Smart Apply V3 — Combined Preparation Endpoint

POST /ai/smart-apply-prepare
Returns EVERYTHING the frontend wizard needs in one call:
  - Match score + requirement map + skill gap
  - Selection probability
  - Cover letter (generated)
  - Answers (generated)
  - Autofill payload with AI disclosure
  - Quality report

Compliance:
  - No auto-submission
  - No external platform auth
  - AI disclosure mandatory
  - All generated text is user-editable
"""
from fastapi import APIRouter, HTTPException, Request
from app.database import supabase_admin
from app.services.matcher import (
    compute_match_score_v2,
    score_to_selection_label,
    generate_improvement_suggestions,
)
from app.services.predictor import predict_selection_probability
from app.services.writing import generate_cover_letter, generate_answer
from app.services.autofill_prep import build_autofill_payload
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/ai", tags=["ai"])


class SmartApplyPrepareRequest(BaseModel):
    job_id: str
    resume_id: str


@router.post("/smart-apply-prepare")
async def smart_apply_prepare(data: SmartApplyPrepareRequest, request: Request):
    """
    Combined endpoint for Smart Apply V3 wizard.

    Returns match analysis + AI-generated content + autofill payload
    in a single API call so the wizard can render all steps instantly.
    """
    # ── Auth ──
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
        print("Auth error in smart-apply-prepare:", str(e))
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        # ── Fetch job ──
        job_res = supabase_admin.table("jobs").select("*").eq("id", data.job_id).single().execute()
        if not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = job_res.data

        # ── Fetch resume ──
        resume_res = supabase_admin.table("resumes").select("*").eq("id", data.resume_id).single().execute()
        if not resume_res.data:
            raise HTTPException(status_code=404, detail="Resume not found")
        resume = resume_res.data

        # ── Fetch profile ──
        profile_res = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
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
                "user_message": f"Your profile is missing: {', '.join(missing_fields)}. Please update your profile before using Smart Apply.",
            }

        # ── Match Analysis ──
        resume_skills = resume.get("skills", [])
        job_skills = job.get("skills", [])
        resume_text = resume.get("raw_text", " ".join(resume_skills))
        job_description = job.get("description", "") or (job.get("title", "") + " " + " ".join(job_skills))

        user_experience_months = profile.get("total_experience_months", 0) or 0
        user_education = profile.get("education", "") or ""

        match_result = compute_match_score_v2(
            resume_text=resume_text,
            job_description=job_description,
            resume_skills=resume_skills,
            job_skills=job_skills,
            user_experience_months=user_experience_months,
            user_education=user_education,
        )

        # Selection probability
        selection_label = score_to_selection_label(match_result["score"])
        prediction = predict_selection_probability(
            match_score=match_result["score"],
            resume_skills=resume_skills,
            job_skills=job_skills,
            resume_text=resume_text,
            job_text=job_description,
        )

        # Improvement suggestions
        suggestions = generate_improvement_suggestions(
            match_result["requirement_map"],
            match_result["missing_hard_skills"],
            match_result["missing_soft_skills"],
        )

        # Strategic advice
        score = match_result["score"]
        company = job.get("company", "this company")
        if score >= 85:
            advice = f"You are a strong match for this role at {company}. Apply now with a tailored cover letter highlighting your matching skills."
        elif score >= 70:
            advice = f"Solid match. Apply with confidence but address the 1-2 skill gaps in your cover letter. Show willingness to learn."
        elif score >= 50:
            advice = f"Moderate match. Consider addressing skill gaps through projects before applying. A strong cover letter about transferable skills could help."
        elif score >= 30:
            advice = f"Below-average match. We recommend upskilling on the hard requirements first, or targeting roles closer to your current skill level."
        else:
            advice = f"Significant skill mismatch. Consider this a stretch role. Focus on building the missing hard skills first."

        # ── AI Content Generation ──
        # Enrich profile with resume data
        profile["resume_text"] = resume_text
        profile["resume_url"] = resume.get("file_url", "")

        # Get user's auth email
        try:
            user_res = supabase_admin.auth.admin.get_user_by_id(user_id)
            if user_res and user_res.user:
                profile["email"] = user_res.user.email
        except Exception:
            pass

        # Cover letter
        tone = profile.get("cover_letter_tone", "professional")
        cover_letter = generate_cover_letter(profile, job, tone)

        # Answers
        answers = []
        questions = []

        # Add job's detected questions
        detected = job.get("detected_questions", [])
        if isinstance(detected, list):
            questions.extend(detected)

        # Add platform-specific common questions
        platform = (job.get("platform") or "").lower()
        if platform == "internshala":
            if "Why should you be hired for this role?" not in questions:
                questions.append("Why should you be hired for this role?")

        # Always include a "Why hire you" question if none detected
        if not questions:
            questions.append("Why should you be hired for this role?")

        for q in questions:
            if q and q.strip():
                ans = generate_answer(q.strip(), profile)
                answers.append(ans)

        # ── Build autofill payload ──
        autofill_result = build_autofill_payload(
            profile=profile,
            job=job,
            cover_letter=cover_letter,
            answers=answers,
        )

        # ── Save to autofill history (non-critical) ──
        try:
            supabase_admin.table("autofill_history").insert({
                "user_id": user_id,
                "job_id": data.job_id,
                "payload": autofill_result["autofill_payload"],
                "quality_report": autofill_result["quality_report"],
                "platform_notes": autofill_result["platform_notes"],
            }).execute()
        except Exception:
            pass

        # ── Return combined result ──
        return {
            # Match analysis
            "match_analysis": {
                "score": match_result["score"],
                "score_breakdown": match_result["score_breakdown"],
                "requirement_map": match_result["requirement_map"],
                "matching_skills": match_result["matching_skills"],
                "missing_hard_skills": match_result["missing_hard_skills"],
                "missing_soft_skills": match_result["missing_soft_skills"],
                "transferable_skills": match_result["transferable_skills"],
                "experience_assessment": match_result["experience_assessment"],
                "education_match": match_result["education_match"],
                "semantic_score": match_result.get("semantic_score"),
                "selection_probability": selection_label,
                "selection_reasoning": prediction.get("reasoning", ""),
                "improvement_suggestions": suggestions,
                "strategic_advice": advice,
            },
            # Autofill payload (editable content)
            "autofill_payload": autofill_result["autofill_payload"],
            "ai_disclosure": autofill_result["ai_disclosure"],
            "platform_notes": autofill_result["platform_notes"],
            "editable_flags": autofill_result["editable_flags"],
            "quality_report": autofill_result["quality_report"],
            # Metadata
            "resume_used": {
                "id": resume.get("id"),
                "filename": resume.get("filename"),
            },
            "job_info": {
                "id": job.get("id"),
                "title": job.get("title"),
                "company": job.get("company"),
                "platform": job.get("platform"),
                "apply_link": job.get("apply_link"),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
