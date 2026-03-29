"""
AI Router v2.0

Endpoints:
  POST /ai/match-score      — Full match analysis with tiered scoring
  POST /ai/skill-gap         — Skill gap with actionable suggestions
  POST /ai/selection-probability — Predict selection chance
  POST /ai/batch-match       — Score all jobs against a resume
"""
from fastapi import APIRouter, HTTPException
from app.models import MatchRequest, MatchResponse, SkillGapRequest, SkillGapResponse
from app.database import supabase
from app.services.matcher import (
    compute_match_score_v2,
    score_to_selection_label,
    generate_improvement_suggestions,
    get_skill_recommendations,
)
from app.services.predictor import predict_selection_probability

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/match-score")
async def match_score(data: MatchRequest):
    """
    v2.0 match analysis with tiered requirements, experience penalty,
    education bonus, and actionable improvement suggestions.
    """
    try:
        # Fetch resume
        resume_res = supabase.table("resumes").select("*").eq("id", data.resume_id).single().execute()
        if not resume_res.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Fetch job
        job_res = supabase.table("jobs").select("*").eq("id", data.job_id).single().execute()
        if not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found")

        resume = resume_res.data
        job = job_res.data

        resume_skills = resume.get("skills", [])
        job_skills = job.get("skills", [])
        resume_text = resume.get("raw_text", " ".join(resume_skills))
        job_description = job.get("description", "") or (job.get("title", "") + " " + " ".join(job_skills))

        # Fetch user profile for experience/education context
        user_experience_months = 0
        user_education = ""
        if resume.get("user_id"):
            try:
                profile_res = supabase.table("profiles").select("total_experience_months, education").eq("user_id", resume["user_id"]).single().execute()
                if profile_res.data:
                    user_experience_months = profile_res.data.get("total_experience_months", 0) or 0
                    user_education = profile_res.data.get("education", "") or ""
            except Exception:
                pass

        # Compute v2.0 match score
        result = compute_match_score_v2(
            resume_text=resume_text,
            job_description=job_description,
            resume_skills=resume_skills,
            job_skills=job_skills,
            user_experience_months=user_experience_months,
            user_education=user_education,
        )

        # Selection probability
        selection_label = score_to_selection_label(result["score"])
        prediction = predict_selection_probability(
            match_score=result["score"],
            resume_skills=resume_skills,
            job_skills=job_skills,
            resume_text=resume_text,
            job_text=job_description,
        )

        # Improvement suggestions
        suggestions = generate_improvement_suggestions(
            result["requirement_map"],
            result["missing_hard_skills"],
            result["missing_soft_skills"],
        )

        # Strategic advice
        score = result["score"]
        if score >= 85:
            advice = f"You are a strong match for this role at {job.get('company', 'this company')}. Apply now with a tailored cover letter highlighting your matching skills."
        elif score >= 70:
            advice = f"Solid match. Apply with confidence but address the 1-2 skill gaps in your cover letter. Show willingness to learn."
        elif score >= 50:
            advice = f"Moderate match. Consider addressing the skill gaps through a quick project or course before applying. A strong cover letter explaining transferable skills could help."
        elif score >= 30:
            advice = f"Below-average match. We recommend upskilling on the hard requirements first, or targeting roles closer to your current skill level."
        else:
            advice = f"Significant skill mismatch. Consider this a stretch role. Focus on building the missing hard skills first, then revisit."

        return {
            "score": result["score"],
            "score_breakdown": result["score_breakdown"],
            "requirement_map": result["requirement_map"],
            "matching_skills": result["matching_skills"],
            "missing_hard_skills": result["missing_hard_skills"],
            "missing_soft_skills": result["missing_soft_skills"],
            "missing_skills": result["missing_skills"],
            "transferable_skills": result["transferable_skills"],
            "experience_assessment": result["experience_assessment"],
            "education_match": result["education_match"],
            "selection_probability": selection_label,
            "selection_reasoning": prediction["reasoning"],
            "prediction": prediction,
            "improvement_suggestions": suggestions,
            "strategic_advice": advice,
            "semantic_score": result.get("semantic_score"),
            "skill_score": result.get("skill_score"),
            "resume_skills": resume_skills,
            "job_skills": job_skills,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/selection-probability")
async def selection_probability(data: MatchRequest):
    """Predict chance of getting selected."""
    try:
        resume_res = supabase.table("resumes").select("*").eq("id", data.resume_id).single().execute()
        job_res = supabase.table("jobs").select("*").eq("id", data.job_id).single().execute()

        if not resume_res.data or not job_res.data:
            raise HTTPException(status_code=404, detail="Resume or Job not found")

        resume = resume_res.data
        job = job_res.data

        job_description = job.get("description", "") or (job.get("title", "") + " " + " ".join(job.get("skills", [])))

        match_result = compute_match_score_v2(
            resume.get("raw_text", ""),
            job_description,
            resume.get("skills", []),
            job.get("skills", []),
        )

        prediction = predict_selection_probability(
            match_score=match_result["score"],
            resume_skills=resume.get("skills", []),
            job_skills=job.get("skills", []),
            resume_text=resume.get("raw_text", ""),
            job_text=job_description,
        )

        return {**match_result, "prediction": prediction, "resume_skills": resume.get("skills", []), "job_skills": job.get("skills", [])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skill-gap", response_model=SkillGapResponse)
async def skill_gap(data: SkillGapRequest):
    try:
        resume_res = supabase.table("resumes").select("*").eq("id", data.resume_id).single().execute()
        job_res = supabase.table("jobs").select("*").eq("id", data.job_id).single().execute()

        if not resume_res.data or not job_res.data:
            raise HTTPException(status_code=404, detail="Resume or Job not found")

        resume_skills = [s.lower() for s in (resume_res.data.get("skills") or [])]
        job_skills = [s.lower() for s in (job_res.data.get("skills") or [])]

        matching = [s for s in job_skills if s in resume_skills]
        missing = [s for s in job_skills if s not in resume_skills]
        recommendations = get_skill_recommendations(missing)

        return SkillGapResponse(
            missing_skills=missing,
            matching_skills=matching,
            recommendations=recommendations
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-match")
async def batch_match(data: dict):
    """Score all active jobs against a resume."""
    resume_id = data.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")

    try:
        resume_res = supabase.table("resumes").select("*").eq("id", resume_id).single().execute()
        if not resume_res.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        jobs_res = supabase.table("jobs").select("*").eq("is_active", True).execute()
        jobs = jobs_res.data or []

        resume = resume_res.data
        resume_text = resume.get("raw_text", "")
        resume_skills = resume.get("skills", [])

        results = []
        for job in jobs:
            job_description = job.get("description", "") or (job.get("title", "") + " " + " ".join(job.get("skills", [])))
            job_skills = job.get("skills", [])

            score = compute_match_score_v2(resume_text, job_description, resume_skills, job_skills)
            results.append({"job_id": job["id"], "job": job, **score})

        results.sort(key=lambda x: x["score"], reverse=True)
        return {"matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
