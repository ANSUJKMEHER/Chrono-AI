# Devpost Submission Guide: ChronoAI for "Hack to the Future"

> **Target Hackathon:** Hack to the Future (`hack-to-the-missing-future-ai.devpost.com`)  
> **App Upgraded:** Google Calendar  
> **Deadline:** Oct 28, 2026 @ 2:30am IST  
> **Judge:** Mitchelle Ashley Creado (Microsoft)

---

## 📋 Copy-Paste Devpost Form Fields

### 1. Project Title
```text
ChronoAI — The Missing Deadline Intelligence in Google Calendar
```

### 2. Elevator Pitch / Tagline (One sentence)
```text
"Don't just remember your deadlines. Know exactly how to prepare for them." — An AI deadline decoder and backward preparation scheduler built for Google Calendar.
```

### 3. The App You Upgraded
```text
Existing App: Google Calendar
New Feature: ChronoAI (AI Deadline Extraction, Ambiguity Resolution & Backward Preparation Scheduler)
```

### 4. Problem Statement (2 to 3 sentences)
```text
Students and professionals receive deadlines buried in unstructured assignment emails, syllabi, and chat messages, yet Google Calendar remains a passive tool that only records when a deadline occurs. It does not extract requirements, identify ambiguous dates, or tell users when to actually begin working. This leads to missed constraints, decision fatigue, and severe deadline cramming.
```

### 5. Before and After
```text
BEFORE:
A student receives a dense assignment email, manually scans for dates, creates a standalone calendar reminder on the due date, and tries to remember to work on it. With no structured roadmap, they procrastinate and cram the night before.

AFTER:
The student pastes the raw announcement into ChronoAI. In seconds, ChronoAI extracts the deadline, flags ambiguous dates, breaks the assignment into subtasks, and generates an automatic backward-scheduled preparation roadmap placed directly onto their calendar with daily danger-score tracking.
```

### 6. How It Works (Tools, APIs, Languages, AI Models)
```text
- Frontend & UI: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- AI Models & Engines: NVIDIA NIM (meta/llama-3.1-70b-instruct) via OpenAI-compatible API for deep semantic parsing
- Deterministic Fallback Engine: Built-in offline regex & natural date parser ensuring 100% offline availability and zero hallucination risk
- Planning Algorithm: Custom backward-scheduling engine factoring in user working hours (09:00–21:00), daily prep capacity (max 3h/day), and deadline buffer windows
- Integrations: RFC 5545 .ics Calendar Generator for seamless 1-click import into Google Calendar and Apple Calendar
- State & Persistence: LocalStorage with schema validation and zero data leakage
```

### 7. How the Company (Google) Could Roll This Feature Out
```text
Google can natively integrate ChronoAI as a Gemini Workspace side-panel extension across Gmail and Google Calendar. When an email or Classroom announcement contains an assignment, a native "Schedule with Prep Plan" button would appear, automatically placing both the deadline event and spaced preparation focus blocks onto the student's Google Calendar.
```

---

## 🎬 3-Minute Video Demo Script (YouTube / Loom)

*Record your screen at `http://127.0.0.1:3000/`. Keep it punchy and under 3 minutes:*

| Timestamp | Screen | What to Say / Do |
|---|---|---|
| **0:00 – 0:35** | **Dashboard** | *"Hi! This is ChronoAI, built for Hack to the Future. We picked Google Calendar because millions use it daily, but it has a major blindspot: it reminds you WHEN something is due, but never tells you HOW or WHEN to prepare for it. Here is our dashboard with live summary stats, today's schedule, and our AI intelligence status."* |
| **0:35 – 1:15** | **Click "+ Add from Text"** | *"Instead of manually typing an event, a student just clicks '+ Add from Text'. Let's click the sample 'ML Assignment' email. Watch our 4-stage pipeline: ChronoAI uses Llama 3.1 70B to scan the text, detect the Oct 29 11:59 PM deadline, extract 5 discrete subtasks, and calculate 4 hours of effort. Notice the ambiguity warning if the time was missing!"* |
| **1:15 – 1:50** | **Review & Approve** | *"Here is our signature feature: Preparation Strategy. We can pick 'Spaced', 'Early Bird', or 'Intensive'. When I click 'Approve & Create Plan', ChronoAI works backward from October 29th and places structured prep blocks on my calendar without exceeding my daily study limit."* |
| **1:50 – 2:25** | **Calendar & Today's Plan** | *"Now let's switch to the Interactive Calendar. Deadlines are clearly flagged in amber, while scheduled prep blocks appear in indigo. In the dashboard's Today's Action Plan, I can check off a session right now — confetti fires! And look at the Danger Score badge on tasks: if remaining work exceeds remaining time, it warns the student with a high load alert."* |
| **2:25 – 3:00** | **.ICS Export & Wrap-up** | *"Finally, with one click on 'Export .ICS', students can import the entire roadmap straight into their official Google Calendar. ChronoAI transforms Google Calendar from a passive reminder into an active preparation coach. Thank you!"* |

---

## 🚀 How to Push to GitHub (Source Code Link)

Run these 3 commands in your terminal to push your repository to your GitHub account:

```bash
# 1. Create a new empty repository on github.com called "chronoai"
# 2. Link your local repo and push:
git remote add origin https://github.com/YOUR_USERNAME/chronoai.git
git branch -M main
git push -u origin main
```
