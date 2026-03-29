"""
Internshala job scraper using Playwright
"""
import asyncio
from playwright.async_api import async_playwright
from typing import List, Dict
import re


MOCK_JOBS = [
    {
        "title": "Software Development Intern",
        "company": "TechCorp India",
        "location": "Remote",
        "skills": ["Python", "Django", "REST API", "SQL"],
        "stipend": "₹15,000/month",
        "apply_link": "https://internshala.com/internship/software-development",
        "platform": "internshala"
    },
    {
        "title": "Frontend Developer Intern",
        "company": "StartupXYZ",
        "location": "Bangalore",
        "skills": ["React.js", "JavaScript", "HTML", "CSS", "TailwindCSS"],
        "stipend": "₹12,000/month",
        "apply_link": "https://internshala.com/internship/frontend-development",
        "platform": "internshala"
    },
    {
        "title": "Data Science Intern",
        "company": "Analytics Hub",
        "location": "Remote",
        "skills": ["Python", "Machine Learning", "Pandas", "NumPy", "Scikit-learn"],
        "stipend": "₹20,000/month",
        "apply_link": "https://internshala.com/internship/data-science",
        "platform": "internshala"
    },
    {
        "title": "UI/UX Design Intern",
        "company": "DesignStudio",
        "location": "Mumbai",
        "skills": ["Figma", "UI Design", "Prototyping", "User Research"],
        "stipend": "₹10,000/month",
        "apply_link": "https://internshala.com/internship/ui-ux-design",
        "platform": "internshala"
    },
    {
        "title": "Machine Learning Intern",
        "company": "AI Solutions Ltd",
        "location": "Hyderabad",
        "skills": ["Python", "TensorFlow", "Deep Learning", "NLP", "PyTorch"],
        "stipend": "₹25,000/month",
        "apply_link": "https://internshala.com/internship/machine-learning",
        "platform": "internshala"
    },
    {
        "title": "Backend Developer Intern",
        "company": "CloudBase Inc",
        "location": "Remote",
        "skills": ["Node.js", "Express.js", "MongoDB", "REST API", "Docker"],
        "stipend": "₹18,000/month",
        "apply_link": "https://internshala.com/internship/backend-development",
        "platform": "internshala"
    },
    {
        "title": "Android App Developer Intern",
        "company": "MobileFirst",
        "location": "Pune",
        "skills": ["Android", "Java", "Kotlin", "Android Studio", "Firebase"],
        "stipend": "₹14,000/month",
        "apply_link": "https://internshala.com/internship/android-development",
        "platform": "internshala"
    },
    {
        "title": "Full Stack Developer Intern",
        "company": "WebWorks Technologies",
        "location": "Delhi",
        "skills": ["React.js", "Node.js", "MongoDB", "Express.js", "JavaScript"],
        "stipend": "₹22,000/month",
        "apply_link": "https://internshala.com/internship/full-stack-development",
        "platform": "internshala"
    },
    {
        "title": "DevOps Engineer Intern",
        "company": "InfraCloud",
        "location": "Remote",
        "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"],
        "stipend": "₹20,000/month",
        "apply_link": "https://internshala.com/internship/devops",
        "platform": "internshala"
    },
    {
        "title": "Business Analyst Intern",
        "company": "ConsultPro",
        "location": "Chennai",
        "skills": ["Excel", "SQL", "Data Analysis", "PowerBI", "Communication"],
        "stipend": "₹8,000/month",
        "apply_link": "https://internshala.com/internship/business-analyst",
        "platform": "internshala"
    },
    {
        "title": "Cybersecurity Intern",
        "company": "SecureNet",
        "location": "Noida",
        "skills": ["Network Security", "Penetration Testing", "Python", "Linux", "Kali Linux"],
        "stipend": "₹16,000/month",
        "apply_link": "https://internshala.com/internship/cybersecurity",
        "platform": "internshala"
    },
    {
        "title": "Product Management Intern",
        "company": "ProductLabs",
        "location": "Bangalore",
        "skills": ["Product Strategy", "User Research", "Agile", "Roadmapping", "Jira"],
        "stipend": "₹18,000/month",
        "apply_link": "https://internshala.com/internship/product-management",
        "platform": "internshala"
    },
]


async def scrape_internshala(search_query: str = "software developer", max_pages: int = 1) -> List[Dict]:
    """
    Scrape internships from Internshala.
    Falls back to mock data if scraping fails or returns nothing.
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            all_jobs = []

            for page_num in range(1, max_pages + 1):
                url = f"https://internshala.com/internships/{search_query.replace(' ', '-')}-internship/page-{page_num}/"
                print(f"DEBUG: Scraping {url}")
                await page.goto(url, timeout=30000, wait_until="networkidle")
                await page.wait_for_timeout(2000)

                # Wait for the container if it exists
                try:
                    await page.wait_for_selector(".individual_internship", timeout=10000)
                except:
                    print(f"DEBUG: Cards not found on page {page_num}")
                    continue

                internship_cards = await page.query_selector_all(".individual_internship")
                print(f"DEBUG: Found {len(internship_cards)} cards on page {page_num}")

                for card in internship_cards:
                    try:
                        # Refined selectors based on latest DOM analysis
                        title_el = await card.query_selector(".job-internship-name, .job-title-href, h3, .heading_4_5")
                        company_el = await card.query_selector(".company-name, .link_display_like_text, .company_name")
                        location_el = await card.query_selector(".location_link, .locations, .individual_internship_details")
                        stipend_el = await card.query_selector(".stipend, .stipend_container")
                        link_el = await card.query_selector("a.job-title-href, a.view_detail_button, a[href*='/internship/detail/']")

                        title_text = (await title_el.inner_text()).strip() if title_el else None
                        company_text = (await company_el.inner_text()).strip() if company_el else None
                        
                        if not title_text or not company_text:
                            continue

                        loc_text = (await location_el.inner_text()).strip() if location_el else "Remote"
                        stipend_text = (await stipend_el.inner_text()).strip() if stipend_el else "Unpaid"
                        
                        link = await link_el.get_attribute("href") if link_el else ""
                        full_link = f"https://internshala.com{link}" if link and not link.startswith("http") else link

                        # Extract skills
                        skill_els = await card.query_selector_all(".skill_container .skills span, .skills span")
                        skills = []
                        for s in skill_els:
                            text = (await s.inner_text()).strip()
                            if text:
                                skills.append(text)

                        description = f"Internship at {company_text} for {title_text} position. Location: {loc_text}. Stipend: {stipend_text}."

                        all_jobs.append({
                            "title": title_text,
                            "company": company_text,
                            "location": loc_text,
                            "description": description,
                            "skills": skills or ["General"],
                            "stipend": stipend_text,
                            "apply_link": full_link,
                            "platform": "internshala",
                            "is_active": True
                        })
                    except Exception as card_err:
                        print(f"Card error: {card_err}")
                        continue

            await browser.close()
            
            # Remove duplicates
            unique_jobs = {j["apply_link"]: j for j in all_jobs}.values() if all_jobs else []
            final_jobs = list(unique_jobs)
            
            print(f"DEBUG: Successfully scraped {len(final_jobs)} total unique jobs")
            return final_jobs if final_jobs else MOCK_JOBS
    except Exception as e:
        print(f"Scraping failed, using mock data: {e}")
        return MOCK_JOBS
