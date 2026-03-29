from fastapi import APIRouter, HTTPException, Header
from app.models import DashboardStats, ActivityItem
from app.database import supabase_admin
from app.routers.profile import get_user_id
from typing import Optional
import datetime

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    
    try:
        # 1. Fetch Applications
        apps_res = supabase_admin.table("applications").select("*, jobs(title, company)").eq("user_id", user_id).order("applied_at", desc=True).execute()
        apps = apps_res.data or []
        
        # 2. Fetch Resumes
        resumes_res = supabase_admin.table("resumes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        resumes = resumes_res.data or []
        
        # 3. Calculate Stats
        applied_count = len(apps)
        # Mocking interviews/offers for now as the 'status' logic is simple 'applied' by default
        interviews_count = len([a for a in apps if a.get("status") == "interviewing"])
        offers_count = len([a for a in apps if a.get("status") == "offered"])
        
        scores = [a.get("match_score") for a in apps if a.get("match_score") is not None]
        match_success_rate = (sum(scores) / len(scores)) if scores else 0.0
        
        # 4. Compile Recent Activities
        activities = []
        
        # Add Recent applications
        for a in apps[:5]:
            activities.append(ActivityItem(
                id=f"app_{a['id']}",
                type="application",
                title=f"Applied to {a['jobs']['title']}",
                description=f"at {a['jobs']['company']}",
                timestamp=a['applied_at'],
                meta={"status": a['status']}
            ))
            
        # Add Recent resumes
        for r in resumes[:3]:
            activities.append(ActivityItem(
                id=f"res_{r['id']}",
                type="resume",
                title="Resume Uploaded",
                description=r['filename'],
                timestamp=r['created_at']
            ))
            
        # Sort by timestamp
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        return DashboardStats(
            applied_count=applied_count,
            interviews_count=interviews_count,
            offers_count=offers_count,
            match_success_rate=round(match_success_rate, 2),
            recent_activities=activities[:8],
            total_resumes=len(resumes)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
