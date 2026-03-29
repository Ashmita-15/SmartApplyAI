from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.database import supabase
from app.services.scraper import scrape_internshala
from typing import Optional, List

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def get_jobs(
    role: Optional[str] = None,
    location: Optional[str] = None,
    skills: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    try:
        query = supabase.table("jobs").select("*")
        if role:
            query = query.ilike("title", f"%{role}%")
        if location:
            query = query.ilike("location", f"%{location}%")
        result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        jobs = result.data or []

        # Filter by skills if provided
        if skills:
            skill_list = [s.strip().lower() for s in skills.split(",")]
            filtered = []
            for job in jobs:
                job_skills = [s.lower() for s in (job.get("skills") or [])]
                if any(sk in job_skills for sk in skill_list):
                    filtered.append(job)
            jobs = filtered

        return {"jobs": jobs, "total": len(jobs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    """Trigger a background job scraping from Internshala"""
    background_tasks.add_task(run_scrape, "software developer")
    return {"message": "Scraping started in background. Check /jobs in a few seconds."}


@router.get("/scrape/{query}")
async def trigger_scrape_query(query: str, background_tasks: BackgroundTasks):
    """Trigger a background job scraping for a specific query"""
    background_tasks.add_task(run_scrape, query)
    return {"message": f"Scraping '{query}' started in background. Check /jobs shortly."}


async def run_scrape(query: str = "software developer"):
    try:
        jobs = await scrape_internshala(query)
        for job in jobs:
            # Upsert to avoid duplicates
            supabase.table("jobs").upsert(job, on_conflict="apply_link").execute()
    except Exception as e:
        print(f"Scraping error: {e}")


@router.get("/{job_id}")
async def get_job(job_id: str):
    try:
        result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")
        return result.data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
