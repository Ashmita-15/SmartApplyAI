from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str


# Resume
class ResumeResponse(BaseModel):
    id: str
    filename: str
    skills: List[str]
    created_at: str


# Job
class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: str
    skills: List[str]
    stipend: Optional[str]
    apply_link: str
    platform: str
    created_at: str


# Match
class MatchRequest(BaseModel):
    resume_id: str
    job_id: str


class MatchResponse(BaseModel):
    score: float
    semantic_score: Optional[float] = None
    skill_score: Optional[float] = None
    matching_skills: List[str]
    missing_skills: List[str]
    resume_skills: List[str]
    job_skills: List[str]


class PredictionResponse(BaseModel):
    probability: float
    confidence: str
    message: str
    features: dict


# Skill Gap
class SkillGapRequest(BaseModel):
    resume_id: str
    job_id: str


class SkillGapResponse(BaseModel):
    missing_skills: List[str]
    matching_skills: List[str]
    recommendations: List[str]


# Application
class ApplyRequest(BaseModel):
    job_id: str
    resume_id: str
    user_details: Optional[dict] = None


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    resume_id: str
    status: str
    match_score: Optional[float]
    applied_at: str
    job: Optional[dict] = None


# Profile
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    preferences: Optional[dict] = None
    avatar_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    preferences: dict = {}
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Dashboard
class ActivityItem(BaseModel):
    id: str
    type: str  # 'application', 'resume', 'profile'
    title: str
    description: str
    timestamp: str
    meta: Optional[dict] = None


class DashboardStats(BaseModel):
    applied_count: int
    interviews_count: int
    offers_count: int
    match_success_rate: float
    recent_activities: List[ActivityItem]
    total_resumes: int


# ──────────────────────────────────────────
# v2.0: Enhanced Match Models
# ──────────────────────────────────────────
class RequirementMapItem(BaseModel):
    requirement: str
    tier: str  # HARD, SOFT, IMPLICIT
    status: str  # MATCHED, PARTIAL, TRANSFERABLE, MISSING_HARD, MISSING_SOFT
    evidence: str

class TransferableSkill(BaseModel):
    user_has: str
    maps_to: str
    confidence: str

class ExperienceAssessment(BaseModel):
    required: str
    user_has: str
    gap: str
    mitigating_factors: str

class ImprovementSuggestion(BaseModel):
    gap: str
    action: str
    impact: str
    timeframe: str

class ScoreBreakdown(BaseModel):
    hard_requirements_met: str
    soft_requirements_met: str
    implicit_requirements_met: str
    experience_gap_penalty: int
    education_adjustment: int
    base_score: float

class MatchResponseV2(BaseModel):
    score: float
    score_breakdown: ScoreBreakdown
    requirement_map: List[RequirementMapItem]
    matching_skills: List[str]
    missing_hard_skills: List[str]
    missing_soft_skills: List[str]
    transferable_skills: List[TransferableSkill]
    experience_assessment: Optional[ExperienceAssessment] = None
    education_match: bool
    selection_probability: str
    selection_reasoning: str
    improvement_suggestions: List[ImprovementSuggestion]
    strategic_advice: str
    semantic_score: Optional[float] = None
    resume_skills: List[str] = []
    job_skills: List[str] = []
