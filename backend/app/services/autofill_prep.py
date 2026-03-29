"""
Safe Autofill Payload Builder

Builds a JSON payload from user profile + job data for the user to review
before opening the external job page. NO browser automation happens here.

This replaces auto_apply.py and complies with:
  - Constraint 2: No auto-submission
  - Constraint 3: No external platform authentication
  - Constraint 4: Mandatory AI disclosure
  - Constraint 5: User editability
"""
from typing import Dict, List, Optional
import re


# Platform intelligence
PLATFORM_INTELLIGENCE = {
    "internshala": {
        "known_form_fields": ["name", "email", "phone", "resume", "cover_letter", "why_this_company"],
        "autofill_confidence": "medium",
        "autofill_confidence_reason": "Internshala uses standard HTML form fields. Copy-paste is recommended.",
        "tos_warning": "Internshala's Terms of Service discourage the use of automated application tools. This system only prepares your responses — it does not interact with Internshala directly. You will paste your prepared answers manually.",
        "common_questions": [
            "Why should you be hired for this role?",
            "Are you available for the internship period?",
        ],
    },
    "linkedin": {
        "known_form_fields": ["name", "email", "phone", "resume", "linkedin"],
        "autofill_confidence": "low",
        "autofill_confidence_reason": "LinkedIn Easy Apply has varying form structures. Review all fields manually.",
        "tos_warning": None,
        "common_questions": [],
    },
    "naukri": {
        "known_form_fields": ["name", "email", "phone", "resume"],
        "autofill_confidence": "low",
        "autofill_confidence_reason": "Naukri uses dynamic form rendering. Copy-paste recommended.",
        "tos_warning": None,
        "common_questions": [],
    },
    "unstop": {
        "known_form_fields": ["name", "email", "resume", "essay"],
        "autofill_confidence": "low",
        "autofill_confidence_reason": "Unstop applications often include essay-style questions with longer word limits.",
        "tos_warning": None,
        "common_questions": [],
    },
}


def build_autofill_payload(
    profile: Dict,
    job: Dict,
    cover_letter: str = "",
    answers: Optional[List[Dict]] = None,
) -> Dict:
    """
    Build the safe autofill payload that the user will review and manually paste.
    
    Args:
        profile: User profile data from database
        job: Job posting data
        cover_letter: Generated cover letter text (plain ASCII)
        answers: List of generated answers [{question, answer, question_type, confidence}]
    
    Returns:
        Complete autofill payload with AI disclosure and platform notes
    """
    platform = (job.get("platform") or "other").lower()
    platform_info = PLATFORM_INTELLIGENCE.get(platform, {
        "known_form_fields": ["name", "email", "resume"],
        "autofill_confidence": "low",
        "autofill_confidence_reason": "Unknown platform. Review all fields carefully.",
        "tos_warning": None,
        "common_questions": [],
    })

    # Sanitize generated text for form compatibility
    clean_cover = _sanitize_for_forms(cover_letter) if cover_letter else ""
    clean_answers = []
    fields_flagged = []

    for i, ans in enumerate(answers or []):
        clean_text = _sanitize_for_forms(ans.get("answer", ""))
        words = len(clean_text.split()) if clean_text else 0

        # Flag answers with placeholders or low confidence
        if "[Edit:" in clean_text:
            fields_flagged.append(f"answer_{i + 1} (contains placeholder)")
        if ans.get("confidence") == "low":
            fields_flagged.append(f"answer_{i + 1} (low confidence)")

        clean_answers.append({
            "question": ans.get("question", ""),
            "question_type": ans.get("question_type", "open-ended"),
            "answer": clean_text,
            "word_count": words,
            "confidence": ans.get("confidence", "medium"),
            "confidence_reason": ans.get("confidence_reason", ""),
        })

    if "[Edit:" in clean_cover:
        fields_flagged.append("cover_letter (contains placeholder)")

    # Count quality issues
    placeholder_count = sum(1 for a in clean_answers if "[Edit:" in a["answer"])
    low_confidence_count = sum(1 for a in clean_answers if a["confidence"] == "low")

    cover_words = len(clean_cover.split()) if clean_cover else 0
    if cover_words > 0 and (cover_words < 160 or cover_words > 240):
        quality = "medium"
        quality_notes = f"Cover letter is {cover_words} words (target: 180-220)."
    elif placeholder_count > 0 or low_confidence_count > 0:
        quality = "medium"
        quality_notes = f"{placeholder_count} answer(s) with placeholders, {low_confidence_count} with low confidence."
    else:
        quality = "high"
        quality_notes = "All fields generated with high confidence from profile data."

    return {
        "autofill_payload": {
            "full_name": profile.get("full_name", ""),
            "email": profile.get("email", ""),
            "phone": profile.get("phone", ""),
            "linkedin_url": profile.get("linkedin_url"),
            "portfolio_url": profile.get("portfolio_url"),
            "github_url": profile.get("github_url"),
            "resume_url": profile.get("resume_url"),
            "cover_letter": clean_cover,
            "answers": clean_answers,
        },
        "ai_disclosure": {
            "message": (
                "This content was generated by SmartApply AI based on your stored profile. "
                "All answers reflect your actual experience. Review every field carefully "
                "- especially [Edit:...] placeholders - before submitting."
            ),
            "must_display": True,
            "fields_flagged_for_review": fields_flagged,
        },
        "platform_notes": {
            "platform": platform,
            "known_form_fields": platform_info.get("known_form_fields", []),
            "autofill_confidence": platform_info.get("autofill_confidence", "low"),
            "autofill_confidence_reason": platform_info.get("autofill_confidence_reason", ""),
            "tos_warning": platform_info.get("tos_warning"),
        },
        "editable_flags": {
            "full_name": False,
            "email": False,
            "phone": False,
            "cover_letter": True,
            "answers": True,
            "resume": False,
        },
        "quality_report": {
            "cover_letter_word_count": cover_words,
            "answers_with_placeholders": placeholder_count,
            "answers_with_low_confidence": low_confidence_count,
            "overall_quality": quality,
            "quality_notes": quality_notes,
        },
    }


def _sanitize_for_forms(text: str) -> str:
    """Strip characters that break HTML form value injection."""
    if not text:
        return ""
    replacements = {
        '\u201c': '"', '\u201d': '"',   # curly double quotes
        '\u2018': "'", '\u2019': "'",   # curly single quotes
        '\u2014': '-', '\u2013': '-',   # em/en dash
        '\u2026': '...',               # ellipsis
        '\u2022': '-',                 # bullet
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.strip()
