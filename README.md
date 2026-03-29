# SmartApply AI 🚀

An AI-powered full-stack platform that helps students automatically discover internships/jobs, analyze resume fit, auto-apply, and track all applications in one dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS + Framer Motion + Axios |
| Backend | FastAPI + Playwright |
| AI/ML | SentenceTransformers + NLP skill extraction |
| Database | Supabase (PostgreSQL + Auth + Realtime) |

---

## 🚀 Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase_schema.sql`
3. In Storage, create a **public bucket** named `resumes`
4. Copy your project URL and anon key from **Settings → API**

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run server
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Install dependencies (already done if you followed setup)
npm install

# Run dev server
npm run dev
```

Open `http://localhost:5173`

---

## ✨ Features

### 1. Job Discovery
- Scrapes internships from **Internshala** using Playwright
- Filter by role, location, and skills
- Rich mock data included for instant demos

### 2. Resume Match Score
- Upload PDF resume → NLP skill extraction
- **Semantic similarity** (SentenceTransformers) + **Skill overlap** scoring
- Weighted 60/40 blend for accurate match %

### 3. Skill Gap Analyzer
- Missing vs. matching skills visualization
- Personalized learning recommendations

### 4. Auto Apply
- Playwright fills forms automatically
- 2-second verification delay before submission
- Confirmation modal for safety

### 5. Application Tracker
- Spreadsheet-style dashboard
- Real-time status updates via Supabase subscriptions
- Sortable/filterable with clickable status dropdowns

---

## 📁 Project Structure

```
new/
├── backend/
│   ├── main.py                  # FastAPI entrypoint
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── config.py
│       ├── database.py
│       ├── models.py
│       ├── routers/
│       │   ├── auth.py          # POST /auth/signup, /auth/login
│       │   ├── jobs.py          # GET /jobs, /jobs/scrape, /jobs/{id}
│       │   ├── resume.py        # POST /resume/upload-resume
│       │   ├── ai.py            # POST /ai/match-score, /ai/skill-gap
│       │   └── applications.py  # POST /applications/apply, GET /applications
│       └── services/
│           ├── scraper.py       # Internshala Playwright scraper
│           ├── resume_parser.py # PyMuPDF + NLP skill extraction
│           ├── matcher.py       # SentenceTransformers matching
│           └── auto_apply.py    # Playwright auto-fill
│
├── frontend/
│   └── src/
│       ├── components/layout/Navbar.jsx
│       ├── components/job/JobCard.jsx
│       ├── components/resume/ResumeUpload.jsx
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Auth.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Jobs.jsx
│       │   ├── Match.jsx
│       │   └── Tracker.jsx
│       ├── services/api.js
│       ├── services/supabase.js
│       ├── hooks/useAuth.js
│       └── hooks/useJobs.js
│
└── supabase_schema.sql          # Full DB schema + seed data
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🗄️ API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login → returns JWT |
| GET | `/jobs` | List jobs (filterable) |
| GET | `/jobs/scrape` | Trigger background scrape |
| POST | `/resume/upload-resume` | Upload PDF → extract skills |
| GET | `/resume/resumes` | Get user's resumes |
| POST | `/ai/match-score` | Compute match score |
| POST | `/ai/skill-gap` | Get skill gap + recommendations |
| POST | `/applications/apply` | Apply to job |
| GET | `/applications` | Get user's applications |
| PATCH | `/applications/{id}/status` | Update status |

---

## 📝 Notes

- **SentenceTransformers** model (`all-MiniLM-L6-v2`) downloads on first run (~80MB)
- The Internshala scraper falls back to mock data if anti-bot measures block it
- Auto-apply fills forms but **does not auto-submit** for safety; it marks the app status and lets you manually review
- Supabase service role key is needed for backend writes (bypasses RLS)
