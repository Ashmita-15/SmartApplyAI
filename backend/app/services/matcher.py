"""
Resume-to-Job Matching Engine v2.0

Implements the Master Agent System Prompt v2.0 scoring formula:
  - Tiered requirement extraction (HARD / SOFT / IMPLICIT)
  - Experience penalty
  - Education bonus
  - Full requirement_map with evidence

Scoring:
  base_score = (MATCHED×3 + PARTIAL×1.5 + TRANSFERABLE×1) / (HARD×3 + SOFT×1 + IMPLICIT×1.5) × 100
  experience_penalty = max(0, (required_years - user_years) × 5)
  education_bonus = 3 if match, 0 if not mentioned, -5 if required and missing
  final_score = clamp(base_score - experience_penalty + education_bonus, 0, 100)
"""
from typing import List, Dict, Optional
import re

# ──────────────────────────────────────────────
# Lazy-loaded embedding model
# ──────────────────────────────────────────────
_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"SentenceTransformer load failed: {e}")
    return _model


def _cosine_sim(v1, v2) -> float:
    import numpy as np
    a, b = np.array(v1), np.array(v2)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom else 0.0


# ──────────────────────────────────────────────
# Skill / keyword aliases for fuzzy matching
# ──────────────────────────────────────────────
SKILL_ALIASES = {
    "react.js": ["react", "reactjs"],
    "node.js": ["node", "nodejs"],
    "vue.js": ["vue", "vuejs"],
    "next.js": ["next", "nextjs"],
    "express.js": ["express", "expressjs"],
    "scikit-learn": ["sklearn", "scikit learn"],
    "c++": ["cpp"],
    "c#": ["csharp", "c sharp"],
    "postgresql": ["postgres"],
    "mongodb": ["mongo"],
    "tensorflow": ["tf"],
    "machine learning": ["ml"],
    "deep learning": ["dl"],
    "natural language processing": ["nlp"],
    "ci/cd": ["cicd", "ci cd"],
    "rest api": ["restful", "rest apis"],
    "tailwindcss": ["tailwind", "tailwind css"],
}


def _normalize_skill(skill: str) -> str:
    return skill.lower().strip()


def _skills_match(user_skill: str, job_skill: str) -> bool:
    """Check if two skills match, accounting for aliases."""
    u = _normalize_skill(user_skill)
    j = _normalize_skill(job_skill)
    if u == j:
        return True
    # Check if user skill is an alias of the job skill
    for canonical, aliases in SKILL_ALIASES.items():
        all_forms = [canonical] + aliases
        if j in all_forms and u in all_forms:
            return True
    return False


# ──────────────────────────────────────────────
# Transferable skill map
# ──────────────────────────────────────────────
TRANSFERABLE_SKILLS = {
    "docker": ["kubernetes", "containerization"],
    "react": ["vue", "angular", "frontend"],
    "python": ["data analysis", "scripting"],
    "java": ["kotlin", "android"],
    "javascript": ["typescript"],
    "tensorflow": ["pytorch", "keras"],
    "pytorch": ["tensorflow", "keras"],
    "mysql": ["postgresql", "sql"],
    "postgresql": ["mysql", "sql"],
    "mongodb": ["nosql", "dynamodb"],
    "aws": ["gcp", "azure", "cloud"],
    "gcp": ["aws", "azure", "cloud"],
    "azure": ["aws", "gcp", "cloud"],
    "flask": ["fastapi", "django"],
    "django": ["flask", "fastapi"],
    "machine learning": ["data science", "statistics"],
}


# ──────────────────────────────────────────────
# Requirement classification
# ──────────────────────────────────────────────
HARD_SIGNALS = [
    r'\bmust\s+have\b', r'\brequired\b', r'\bessential\b',
    r'\bmandatory\b', r'\bminimum\b', r'\bprerequisite\b',
    r'\bneed\s+to\s+have\b', r'\bproficien[ct]\b',
]
SOFT_SIGNALS = [
    r'\bnice\s+to\s+have\b', r'\bpreferred\b', r'\bfamiliar(?:ity)?\b',
    r'\bplus\b', r'\bbonus\b', r'\bexposure\s+to\b',
    r'\bknowledge\s+of\b', r'\bunderstanding\s+of\b',
]


def classify_requirement(skill: str, context: str) -> str:
    """Classify a skill as HARD, SOFT, or IMPLICIT based on surrounding JD text."""
    ctx_lower = context.lower()
    # Look in a window around the skill mention
    skill_lower = skill.lower()
    idx = ctx_lower.find(skill_lower)
    if idx == -1:
        return "IMPLICIT"

    window_start = max(0, idx - 120)
    window_end = min(len(ctx_lower), idx + len(skill_lower) + 120)
    window = ctx_lower[window_start:window_end]

    for pattern in HARD_SIGNALS:
        if re.search(pattern, window):
            return "HARD"
    for pattern in SOFT_SIGNALS:
        if re.search(pattern, window):
            return "SOFT"

    # Default: if mentioned in a requirements / skills section, treat as HARD
    if re.search(r'(?:requirements?|qualifications?|skills?\s*(?:required|needed))', ctx_lower):
        return "HARD"
    return "SOFT"


# ──────────────────────────────────────────────
# Experience extraction helpers
# ──────────────────────────────────────────────
def _extract_required_years(jd_text: str) -> Optional[float]:
    """Extract years of experience requirement from JD text."""
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)',
        r'experience\s*(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)',
        r'minimum\s+(\d+)\s*(?:years?|yrs?)',
    ]
    for p in patterns:
        m = re.search(p, jd_text.lower())
        if m:
            return float(m.group(1))
    return None


# ──────────────────────────────────────────────
# Main scoring function (v2.0)
# ──────────────────────────────────────────────
def compute_match_score_v2(
    resume_text: str,
    job_description: str,
    resume_skills: List[str],
    job_skills: List[str],
    user_experience_months: int = 0,
    user_education: str = "",
) -> Dict:
    """
    v2.0 match scoring with tiered requirements, experience penalty, and education bonus.
    """
    # ── Step 1: Classify each job skill ──
    requirement_map = []
    hard_count = 0
    soft_count = 0
    implicit_count = 0

    for skill in job_skills:
        tier = classify_requirement(skill, job_description)
        if tier == "HARD":
            hard_count += 1
        elif tier == "SOFT":
            soft_count += 1
        else:
            implicit_count += 1

        # ── Step 2: Check user match status ──
        status = "MISSING_HARD" if tier == "HARD" else "MISSING_SOFT"
        evidence = ""

        # Direct match
        matched = False
        for rs in resume_skills:
            if _skills_match(rs, skill):
                status = "MATCHED"
                evidence = f"Found '{rs}' in resume skills"
                matched = True
                break

        # Partial / transferable match
        if not matched:
            for rs in resume_skills:
                rs_lower = _normalize_skill(rs)
                related = TRANSFERABLE_SKILLS.get(rs_lower, [])
                if _normalize_skill(skill) in [_normalize_skill(r) for r in related]:
                    status = "TRANSFERABLE"
                    evidence = f"'{rs}' is transferable to '{skill}'"
                    break

            # Check resume text for partial mention
            if status.startswith("MISSING") and resume_text:
                if skill.lower() in resume_text.lower():
                    status = "PARTIAL"
                    evidence = f"'{skill}' mentioned in resume text but not in skills list"

        requirement_map.append({
            "requirement": skill,
            "tier": tier,
            "status": status,
            "evidence": evidence,
        })

    # ── Step 3: Score computation ──
    matched_points = 0
    partial_points = 0
    transferable_points = 0

    matched_skills = []
    missing_hard = []
    missing_soft = []
    transferable_skills = []

    for req in requirement_map:
        if req["status"] == "MATCHED":
            matched_points += 3
            matched_skills.append(req["requirement"])
        elif req["status"] == "PARTIAL":
            partial_points += 1.5
            matched_skills.append(req["requirement"])  # still counts
        elif req["status"] == "TRANSFERABLE":
            transferable_points += 1
            transferable_skills.append({
                "user_has": req["evidence"].split("'")[1] if "'" in req["evidence"] else "",
                "maps_to": f"{req['requirement']} (partial)",
                "confidence": "medium",
            })
        elif req["status"] == "MISSING_HARD":
            missing_hard.append(req["requirement"])
        elif req["status"] == "MISSING_SOFT":
            missing_soft.append(req["requirement"])

    total_weight = (hard_count * 3) + (soft_count * 1) + (implicit_count * 1.5)
    total_earned = matched_points + partial_points + transferable_points
    base_score = (total_earned / total_weight * 100) if total_weight > 0 else 0

    # Experience penalty
    required_years = _extract_required_years(job_description)
    user_years = user_experience_months / 12.0
    experience_penalty = 0
    experience_assessment = None
    if required_years and required_years > 0:
        gap = max(0, required_years - user_years)
        experience_penalty = gap * 5
        experience_assessment = {
            "required": f"{required_years} years",
            "user_has": f"{user_years:.1f} years",
            "gap": f"{gap:.1f} years",
            "mitigating_factors": "Strong project portfolio may compensate" if gap <= 1 else "",
        }

    # Education bonus
    education_bonus = 0
    edu_required = bool(re.search(
        r'\b(?:b\.?tech|b\.?e\.?|b\.?sc|m\.?tech|m\.?sc|mba|bachelor|master|degree)\b',
        job_description.lower()
    ))
    if edu_required:
        if user_education and re.search(
            r'(?:b\.?tech|b\.?e\.?|b\.?sc|m\.?tech|m\.?sc|mba|bachelor|master|degree)',
            user_education.lower()
        ):
            education_bonus = 3
        else:
            education_bonus = -5
    education_match = education_bonus >= 0 if edu_required else True

    # Final score
    final_score = max(0, min(100, round(base_score - experience_penalty + education_bonus)))

    # ── Semantic similarity boost (optional) ──
    semantic_score = None
    model = _get_model()
    if model and resume_text and job_description:
        try:
            embs = model.encode([resume_text[:1000], job_description[:500]])
            sem = _cosine_sim(embs[0], embs[1])
            semantic_score = round(max(0, min(1, sem)) * 100, 1)
        except Exception:
            pass

    # ── Score breakdown ──
    score_breakdown = {
        "hard_requirements_met": f"{len([r for r in requirement_map if r['tier'] == 'HARD' and r['status'] in ('MATCHED', 'PARTIAL')])} of {hard_count}",
        "soft_requirements_met": f"{len([r for r in requirement_map if r['tier'] == 'SOFT' and r['status'] in ('MATCHED', 'PARTIAL')])} of {soft_count}",
        "implicit_requirements_met": f"{len([r for r in requirement_map if r['tier'] == 'IMPLICIT' and r['status'] in ('MATCHED', 'PARTIAL')])} of {implicit_count}",
        "experience_gap_penalty": -round(experience_penalty),
        "education_adjustment": education_bonus,
        "base_score": round(base_score, 1),
    }

    return {
        "score": final_score,
        "score_breakdown": score_breakdown,
        "requirement_map": requirement_map,
        "matching_skills": matched_skills,
        "missing_hard_skills": missing_hard,
        "missing_soft_skills": missing_soft,
        "missing_skills": missing_hard + missing_soft,  # backward compat
        "transferable_skills": transferable_skills,
        "experience_assessment": experience_assessment,
        "education_match": education_match,
        "semantic_score": semantic_score,
        "skill_score": round(base_score, 1),
    }


# ──────────────────────────────────────────────
# Selection probability label
# ──────────────────────────────────────────────
def score_to_selection_label(score: int) -> str:
    if score >= 85:
        return "High"
    elif score >= 70:
        return "Medium-High"
    elif score >= 50:
        return "Medium"
    elif score >= 30:
        return "Low-Medium"
    return "Low"


# ──────────────────────────────────────────────
# Improvement suggestions generator
# ──────────────────────────────────────────────
SKILL_RESOURCES = {
    "python": "Python.org official tutorial or 'Automate the Boring Stuff'",
    "machine learning": "Coursera ML Specialization by Andrew Ng",
    "deep learning": "fast.ai Practical Deep Learning course",
    "react": "official React docs + Scrimba React course",
    "react.js": "official React docs + Scrimba React course",
    "sql": "SQLZoo or Mode Analytics SQL Tutorial",
    "docker": "Docker's official getting started guide",
    "kubernetes": "Kubernetes for Developers on KodeKloud (6 hrs)",
    "aws": "AWS Skill Builder free courses",
    "tensorflow": "TensorFlow official tutorials",
    "pytorch": "PyTorch official tutorials",
    "figma": "Figma's official YouTube tutorials",
    "node.js": "NodeJS.dev documentation",
    "typescript": "TypeScript official handbook",
    "java": "Java Programming MOOC at Helsinki University",
    "android": "Android developer codelabs",
    "flutter": "Flutter official documentation codelabs",
    "data analysis": "Kaggle free Python Data Analysis course",
    "fastapi": "FastAPI official tutorial at fastapi.tiangolo.com",
    "django": "Django official tutorial + djangoproject.com",
    "mongodb": "MongoDB University free courses",
    "git": "Atlassian Git tutorials",
    "linux": "Linux Journey (linuxjourney.com)",
}


def generate_improvement_suggestions(
    requirement_map: List[Dict],
    missing_hard: List[str],
    missing_soft: List[str],
) -> List[Dict]:
    """Generate specific, actionable suggestions for each skill gap."""
    suggestions = []

    # Prioritize hard requirements
    for skill in missing_hard[:5]:
        resource = SKILL_RESOURCES.get(skill.lower())
        if resource:
            action = f"Complete '{resource}', then build a small project using {skill} and add it to your GitHub portfolio."
        else:
            action = f"Search for '{skill} tutorial' on YouTube or Coursera. Build a practice project and push it to GitHub."
        
        suggestions.append({
            "gap": skill,
            "action": action,
            "impact": "High — this is a HARD requirement for this role",
            "timeframe": "1-2 weeks",
        })

    for skill in missing_soft[:3]:
        resource = SKILL_RESOURCES.get(skill.lower())
        action = f"Complete '{resource}'" if resource else f"Explore '{skill}' through online tutorials"
        suggestions.append({
            "gap": skill,
            "action": action,
            "impact": "Medium — this is a preferred/bonus skill",
            "timeframe": "1 week",
        })

    return suggestions


# ──────────────────────────────────────────────
# Backward-compatible wrapper
# ──────────────────────────────────────────────
def compute_match_score(
    resume_text: str,
    job_text: str,
    resume_skills: List[str],
    job_skills: List[str],
) -> Dict:
    """Backward-compatible wrapper that calls v2.0 internally."""
    result = compute_match_score_v2(
        resume_text=resume_text,
        job_description=job_text,
        resume_skills=resume_skills,
        job_skills=job_skills,
    )
    return result


def get_skill_recommendations(missing_skills: List[str]) -> List[str]:
    """Legacy: Generate learning recommendations for missing skills."""
    recs = []
    for skill in missing_skills[:5]:
        resource = SKILL_RESOURCES.get(skill.lower())
        if resource:
            recs.append(f"**{skill}**: {resource}")
        else:
            recs.append(f"**{skill}**: Search for '{skill} tutorial' on YouTube or Coursera")
    return recs
