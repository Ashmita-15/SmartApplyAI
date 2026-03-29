"""
Selection probability predictor using feature-based scoring.
Uses match score, skill overlap, and keyword density to estimate selection chance.
"""
from typing import List, Dict


def predict_selection_probability(
    match_score: float,
    resume_skills: List[str],
    job_skills: List[str],
    resume_text: str = "",
    job_text: str = ""
) -> Dict:
    """
    Predict the probability of selection based on multiple features.
    
    Features:
      - match_score: the overall match score (0-100)
      - skill_overlap_ratio: fraction of job skills found in resume
      - keyword_density: how many job keywords appear in resume text
    
    Returns probability (0-100), confidence level, label, and reasoning.
    """
    # Feature 1: Skill overlap ratio
    resume_skills_lower = {s.lower() for s in resume_skills}
    job_skills_lower = [s.lower() for s in job_skills]
    
    if job_skills_lower:
        overlap = sum(1 for s in job_skills_lower if s in resume_skills_lower)
        skill_overlap_ratio = overlap / len(job_skills_lower)
    else:
        skill_overlap_ratio = 0.0

    # Feature 2: Keyword density in resume text
    keyword_hits = 0
    if resume_text and job_skills_lower:
        resume_lower = resume_text.lower()
        for skill in job_skills_lower:
            if skill in resume_lower:
                keyword_hits += 1
        keyword_density = keyword_hits / len(job_skills_lower)
    else:
        keyword_density = skill_overlap_ratio  # fallback

    # Feature 3: Normalized match score
    norm_match = match_score / 100.0

    # Weighted combination
    probability = (
        0.45 * norm_match +
        0.35 * skill_overlap_ratio +
        0.20 * keyword_density
    ) * 100

    probability = round(max(0, min(100, probability)), 1)

    # Determine label and confidence
    if probability >= 85:
        label = "High"
        confidence = "high"
        reasoning = "Strong match across hard requirements with minimal gaps."
    elif probability >= 70:
        label = "Medium-High"
        confidence = "high"
        reasoning = "Solid match with 1-2 soft skill gaps. Worth applying with a tailored cover letter."
    elif probability >= 50:
        label = "Medium"
        confidence = "medium"
        reasoning = "Passes basic requirements but notable gaps exist. Focus your application on transferable skills."
    elif probability >= 30:
        label = "Low-Medium"
        confidence = "medium"
        reasoning = "Major gaps present. Consider upskilling before applying, or apply with a strong cover letter acknowledging growth areas."
    else:
        label = "Low"
        confidence = "low"
        reasoning = "Significant mismatch. Recommend targeting roles closer to your current skill level first."

    return {
        "probability": probability,
        "label": label,
        "confidence": confidence,
        "reasoning": reasoning,
        "features": {
            "match_score_weight": round(norm_match * 45, 1),
            "skill_overlap_weight": round(skill_overlap_ratio * 35, 1),
            "keyword_density_weight": round(keyword_density * 20, 1),
            "skill_overlap_ratio": round(skill_overlap_ratio * 100, 1),
            "keyword_density": round(keyword_density * 100, 1),
        }
    }
