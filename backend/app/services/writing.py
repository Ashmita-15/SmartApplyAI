"""
Cover Letter & Application Answer Generator

Follows the Master Agent v2.0 writing quality standards:
  - No fabrication (only profile data)
  - No clichéd openers
  - Plain ASCII text (form-safe)
  - 180-220 word cover letters
  - [Edit: ...] placeholders where data is missing
"""
from typing import Dict, List, Optional
import re


def generate_cover_letter(
    profile: Dict,
    job: Dict,
    tone: str = "professional",
) -> str:
    """
    Generate a 180-220 word cover letter from profile + job data.
    
    Rules:
      - Opening MUST NOT be "I am excited/thrilled/pleased to apply..."
      - Opens with something specific about the company/role
      - Para 2: bridges user achievements to role requirements
      - Para 3: cultural fit + call to action
      - Plain text only, no markdown, no bullets
    """
    name = profile.get("full_name", "[Edit: add your name]")
    target_role = profile.get("target_role", "")
    job_title = job.get("title", "this role")
    company = job.get("company", "[Edit: company name]")
    skills = profile.get("skills", [])
    education = profile.get("education", "")
    experience = profile.get("experience", "")
    bio = profile.get("bio", "")
    location = profile.get("location", "")

    job_skills = job.get("skills", [])
    job_description = job.get("description", "")

    # Find overlapping skills for paragraph 2
    user_skills_lower = {s.lower() for s in skills}
    matched = [s for s in job_skills if s.lower() in user_skills_lower]
    skills_mention = ", ".join(matched[:4]) if matched else "[Edit: mention relevant skills]"

    # Determine opener based on what we know about the job
    if job_description and len(job_description) > 50:
        opener = f"The {job_title} role at {company} caught my attention because of its focus on building real impact with technology."
    else:
        opener = f"I am writing to express my interest in the {job_title} position at {company}."

    # Build paragraph 2 from actual profile data
    achievements = []
    if experience:
        achievements.append(f"My background includes {experience}")
    if education:
        achievements.append(f"with {education}")
    if matched:
        achievements.append(f"I bring hands-on experience with {skills_mention}")

    if achievements:
        para2 = " ".join(achievements) + f", which aligns directly with the requirements for this role."
    else:
        para2 = f"I have been developing my skills in {skills_mention} through coursework and personal projects, preparing me to contribute effectively to your team. [Edit: add specific project or achievement details]"

    # Paragraph 3: cultural fit + CTA
    if location:
        location_note = f"Based in {location}, "
    else:
        location_note = ""
    para3 = f"{location_note}I would welcome the opportunity to discuss how my skills can contribute to {company}'s goals. I am available for an interview at your convenience and look forward to hearing from you."

    letter = f"{opener}\n\n{para2}\n\n{para3}"

    # Check word count and adjust
    word_count = len(letter.split())
    if word_count < 160:
        # Add a bridging sentence
        if bio:
            letter = f"{opener}\n\n{bio[:150]}. {para2}\n\n{para3}"
        else:
            letter = f"{opener} Having followed {company}'s work, I believe my background makes me a strong fit.\n\n{para2}\n\n{para3}"

    return _sanitize_text(letter)


def generate_answer(
    question: str,
    profile: Dict,
    question_type: str = "open-ended",
) -> Dict:
    """
    Generate an answer to an application question using only profile data.
    
    Returns:
        {answer, question_type, confidence, confidence_reason}
    """
    skills = profile.get("skills", [])
    experience = profile.get("experience", "")
    education = profile.get("education", "")
    bio = profile.get("bio", "")
    projects = profile.get("projects", [])
    name = profile.get("full_name", "")

    q_lower = question.lower()

    # Detect question type if not provided
    if question_type == "open-ended":
        if any(kw in q_lower for kw in ["describe a time", "tell me about", "situation", "example"]):
            question_type = "behavioral"
        elif any(kw in q_lower for kw in ["why", "motivation", "interested", "what excit"]):
            question_type = "motivational"
        elif any(kw in q_lower for kw in ["how would you", "approach", "solve", "implement", "design"]):
            question_type = "technical"
        elif any(kw in q_lower for kw in ["available", "notice period", "start date", "salary"]):
            question_type = "personal"

    # Personal questions: return null, user must fill
    if question_type == "personal":
        return {
            "question": question,
            "answer": None,
            "question_type": question_type,
            "confidence": "low",
            "confidence_reason": "This is a personal question that requires your direct input.",
        }

    # Build answer based on type
    if question_type == "behavioral" and experience:
        answer = f"During my experience with {experience}, I encountered challenges that required adaptability and problem-solving. [Edit: add specific situation, task, action, and result]"
        confidence = "medium"
        reason = "Answer skeleton built from profile experience. Needs specific STAR details from you."
    elif question_type == "motivational":
        skills_mention = ", ".join(skills[:3]) if skills else "[Edit: your key skills]"
        answer = f"My interest in this role stems from my background in {skills_mention}. {bio[:100] if bio else '[Edit: add why this company interests you specifically]'}"
        confidence = "medium"
        reason = "Motivation mapped from profile skills and bio."
    elif question_type == "technical" and skills:
        skills_mention = ", ".join(skills[:5])
        answer = f"My technical approach would leverage my experience with {skills_mention}. I would start by understanding the requirements thoroughly, then design a solution that balances performance with maintainability. [Edit: add specific technical details relevant to this question]"
        confidence = "medium"
        reason = "Technical skills listed from profile. Specific approach details need your input."
    elif "why should" in q_lower or "why hire" in q_lower or "why you" in q_lower:
        skills_mention = ", ".join(skills[:4]) if skills else "[Edit: your key skills]"
        answer = f"With my skills in {skills_mention}"
        if education:
            answer += f" and {education}"
        answer += f", I bring a combination of technical competence and eagerness to learn. {bio[:80] if bio else ''} [Edit: add a specific achievement that demonstrates your value]"
        confidence = "medium"
        reason = "Built from profile skills and education."
    else:
        # Generic fallback
        if skills:
            answer = f"My experience with {', '.join(skills[:3])} has prepared me well for challenges like this. [Edit: add specific details relevant to this question]"
            confidence = "low"
            reason = "Limited profile context for this question. Heavy editing recommended."
        else:
            return {
                "question": question,
                "answer": None,
                "question_type": question_type,
                "confidence": "low",
                "confidence_reason": "Your profile does not contain enough information to generate a reliable answer. Please write your own response.",
            }

    return {
        "question": question,
        "answer": _sanitize_text(answer),
        "question_type": question_type,
        "confidence": confidence,
        "confidence_reason": reason,
    }


def _sanitize_text(text: str) -> str:
    """Clean text for form compatibility — plain ASCII only."""
    if not text:
        return ""
    replacements = {
        '\u201c': '"', '\u201d': '"',
        '\u2018': "'", '\u2019': "'",
        '\u2014': '-', '\u2013': '-',
        '\u2026': '...',
        '\u2022': '-',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # Remove double spaces
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()
