from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, jobs, resume, ai, applications, profile, dashboard, apply, smart_apply

settings = get_settings()

app = FastAPI(
    title="SmartApply AI API",
    description="AI-powered job application platform",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(resume.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(applications.router)
app.include_router(profile.router)
app.include_router(apply.router)
app.include_router(smart_apply.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SmartApply AI API"}


@app.get("/")
async def root():
    return {
        "name": "SmartApply AI",
        "version": "2.0.0",
        "docs": "/docs"
    }
