"""
Resume PDF parser with NLP-based skill extraction
"""
import fitz  # PyMuPDF
import re
from typing import Dict, List


# Extended skill list for extraction
SKILLS_LIBRARY = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "go", "rust",
    "kotlin", "swift", "ruby", "php", "r", "matlab", "scala", "dart",
    # Web
    "html", "css", "react", "react.js", "angular", "vue", "vue.js", "next.js",
    "nuxt.js", "node.js", "express", "express.js", "django", "flask", "fastapi",
    "spring", "tailwindcss", "bootstrap", "sass", "graphql", "rest api", "webpack",
    # Databases
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "firebase",
    "dynamodb", "sqlite", "cassandra", "supabase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "ci/cd", "linux", "git", "github", "gitlab", "nginx",
    # ML/AI
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
    "pytorch", "scikit-learn", "pandas", "numpy", "keras", "hugging face",
    "langchain", "openai", "transformers",
    # Mobile
    "android", "ios", "react native", "flutter", "android studio", "xcode",
    # Data
    "data analysis", "data science", "power bi", "tableau", "excel", "spark",
    "hadoop", "data visualization", "statistics",
    # Design
    "figma", "adobe xd", "photoshop", "illustrator", "ui design", "ux design",
    "prototyping", "wireframing",
    # Soft skills / Other
    "agile", "scrum", "jira", "communication", "leadership", "problem solving",
    "teamwork", "project management", "product management",
    # Security
    "cybersecurity", "network security", "penetration testing", "kali linux",
    "ethical hacking", "cryptography",
]


def extract_text_from_pdf(content: bytes) -> str:
    """Extract all text from PDF bytes"""
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""


def extract_skills_from_text(text: str) -> List[str]:
    """NLP-based skill extraction from resume text"""
    text_lower = text.lower()
    found_skills = []

    for skill in SKILLS_LIBRARY:
        # Use word boundary matching
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            # Return properly cased version
            found_skills.append(skill.title() if skill.islower() else skill)

    # Also extract skills from "Skills" section
    skills_section_match = re.search(
        r'(?:skills?|technical skills?|core competencies?)[:\s]*([^\n]{20,200})',
        text_lower
    )
    if skills_section_match:
        section_text = skills_section_match.group(1)
        # Extract comma/pipe/bullet separated items
        additional = re.split(r'[,|•·\|/]', section_text)
        for item in additional:
            item = item.strip().strip('•·-').strip()
            if 2 < len(item) < 30 and item not in [s.lower() for s in found_skills]:
                found_skills.append(item.title())

    # Deduplicate while preserving order
    seen = set()
    unique_skills = []
    for skill in found_skills:
        if skill.lower() not in seen:
            seen.add(skill.lower())
            unique_skills.append(skill)

    return unique_skills[:40]  # Cap at 40 skills


def parse_resume_pdf(content: bytes) -> Dict:
    """Parse a resume PDF and extract structured information"""
    raw_text = extract_text_from_pdf(content)
    skills = extract_skills_from_text(raw_text)

    return {
        "raw_text": raw_text,
        "skills": skills,
        "word_count": len(raw_text.split()),
    }
