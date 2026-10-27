# ChronoAI — Your Deadlines, Decoded
### *The Missing Deadline Intelligence in Google Calendar*

> **Hack to the Future 2026 Submission**  
> **Target Platform Enhancement:** Google Calendar  
> **Promise:** *"Don't just remember your deadlines. Know exactly how to prepare for them."*

---

## 📌 Executive Summary & Problem Statement

College students, developers, and busy professionals receive deadlines fragmented across disparate channels: university emails, LMS announcements, Slack messages, syllabi, and group chats.

Traditional calendar systems like Google Calendar require users to manually decipher dates, calculate when to start working, break work down into subtasks, and schedule preparation sessions. The inevitable result: **procrastination, overlooked sub-requirements, and high-stress deadline cramming.**

**ChronoAI** is a proposed intelligent enhancement layer for Google Calendar that bridges the gap between receiving an assignment and submitting it on time. It transforms unstructured text into structured tasks, detects missing or ambiguous dates, and **automatically generates backward-scheduled preparation blocks** placed directly onto an interactive calendar.

---

## 🚀 Key Features

### 1. AI & Deterministic Deadline Extractor
- **Natural Language Parsing:** Paste raw assignment emails, Canvas/Blackboard announcements, or Slack messages.
- **Dual-Engine Architecture:**
  - **Live AI Mode:** Uses OpenAI-compatible endpoints (NVIDIA NIM `meta/llama-3.1-70b-instruct`, OpenAI `gpt-4o-mini`, or custom endpoints) to parse dates, requirements, course codes, and subtasks.
  - **Offline-First Deterministic Fallback:** Built-in regex and heuristic date/time parser with zero external API dependencies. Clearly identified in the UI so users are never misled.
- **Multi-Task Notice Support:** Automatically splits compound notices (e.g. *"Submit DBMS on Friday, attend review on Saturday, and finish DSA on Sunday"*) into independent task candidates.
- **Ambiguity & Missing Information Flags:** Highlights missing years, inferred times, or ambiguous dates (e.g. *"next Friday"*) before saving.

### 2. Backward-Scheduled Preparation Planner
- **Intelligent Pacing Strategies:**
  - **Standard (Spaced):** Evenly distributes study and work blocks across available days.
  - **Early Bird:** Schedules the final deliverable to complete 24 hours prior to deadline for peace of mind.
  - **Intensive (48h):** Focuses rapid preparation sprints in the final 48 hours.
- **Feasibility & Conflict Protection:**
  - Flags unrealistic deadlines (e.g. 8 hours of work with only 3 hours remaining).
  - Respects daily study capacity (e.g. max 3 hours/day) and preferred working hours (e.g. 09:00 – 21:00).
  - Preserves buffer windows before final submission.

### 3. Interactive Calendar (Monthly & Weekly)
- **Visual Separation:**
  - 🚩 **Red / Amber:** Submission Deadlines
  - ⏱️ **Indigo / Violet:** Scheduled Preparation Blocks
  - ✅ **Emerald:** Completed Tasks & Milestones
- **Direct Interactivity:** Click any event to inspect subtasks, edit deadlines, reschedule pacing, or check off completed preparation blocks.
- **Quick-Add on Hover:** Add tasks directly for any day of the month.

### 4. Real-Time Dashboard & 7-Day Workload Bar
- **Real-Time Dynamic Metrics:** Live counters for Due Today, Due This Week, Overdue, and Completed.
- **Today's Action Plan:** Interactive checklist of today's preparation blocks with instant progress updates and celebratory confetti.
- **7-Day Workload Projection:** Visual bar chart showing daily preparation hours and deadline density.

### 5. AI Extraction Inbox & Completed Archive
- **Audit Log (Inbox):** Preserves original announcement texts, extracted candidates, and engine status (AI vs Fallback). Reopen and re-extract anytime.
- **Completed Archive:** Metrics on completed tasks, logged preparation hours, and option to reopen tasks.

### 6. Hackathon Demo Mode
- One-click **"Try Demo Mode"** immediately seeds realistic, relative sample assignments (Machine Learning CNN classifier, Database Systems benchmark, Placement DSA prep, Sprint Retrospective) synchronized to the current date.
- Reset / clear workspace with a single click.

---

## 🛠️ Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS (Modern SaaS palette with Indigo, Emerald, Amber, and Slate)
- **Icons:** Lucide React
- **Celebration Effects:** Canvas Confetti
- **Testing:** Custom Verification Test Runner (`tsx`)
- **Persistence:** LocalStorage with typed schemas and safe error recovery

---

## 🏗️ Architecture & Project Structure

```
chrono/
├── index.html                   # HTML shell with Inter typography
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Theme configuration & color palette
├── vite.config.ts               # Vite configuration (port 3000, 127.0.0.1)
├── tests/
│   └── test-runner.ts           # Algorithmic verification suite
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Application shell & page routing
    ├── index.css                # Tailwind directives & styles
    ├── types/
    │   └── task.ts              # Core TypeScript interfaces & models
    ├── utils/
    │   └── dateUtils.ts         # Date formatting, relative time & math
    ├── services/
    │   ├── storageService.ts    # LocalStorage manager & demo data generator
    │   ├── taskParser.ts        # Deterministic regex & heuristic fallback parser
    │   ├── planningService.ts   # Backward scheduling preparation engine
    │   └── aiService.ts         # LLM API connector & response validator
    ├── context/
    │   └── TaskContext.tsx      # Global state provider & live stat calculations
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx    # Responsive shell
    │   │   ├── Sidebar.tsx      # Brand, navigation, engine badge
    │   │   └── Topbar.tsx       # Search, timezone, demo toggle, quick add
    │   ├── common/
    │   │   └── Toast.tsx        # Toast notification provider
    │   ├── ai/
    │   │   └── DeadlineInputModal.tsx # Core deadline extraction & review modal
    │   ├── tasks/
    │   │   ├── TaskCard.tsx     # Reusable task card
    │   │   └── TaskDetailsModal.tsx # Task inspector, checklist, reschedule
    │   ├── dashboard/
    │   │   ├── SummaryCards.tsx # 4 live metric summary cards
    │   │   ├── TodaySchedule.tsx # Today's interactive action plan
    │   │   ├── UpcomingTasks.tsx # Chronological deadlines with filters
    │   │   └── WorkloadBar.tsx  # 7-day workload distribution chart
    │   └── calendar/
    │       └── CalendarView.tsx # Monthly & weekly interactive calendar
    └── pages/
        ├── DashboardPage.tsx    # Main console
        ├── CalendarPage.tsx     # Full calendar experience
        ├── InboxPage.tsx        # AI extraction history & log
        ├── PlansPage.tsx        # Preparation plans timeline
        ├── CompletedPage.tsx    # Archive & achievements
        └── SettingsPage.tsx     # Engine settings & working hours
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- Node.js (v18 or higher recommended, tested on v22)
- npm (v9 or higher)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd chrono
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The application will launch at:  
👉 **`http://127.0.0.1:3000/`** (or `http://localhost:3000/`)

### 3. Run the Algorithmic Verification Suite
```bash
npm test
```
Runs the test suite verifying:
- Accurate date & time extraction on benchmark assignment prompts.
- Multi-task splitting on conjunction-separated notices.
- Ambiguity detection and missing-year flagging.
- Backward preparation schedule math and deadline safety bounds.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

To preview the production build locally:
```bash
npm run preview
```

---

## 🔑 AI Configuration & Honest Fallback

ChronoAI is designed with **honesty and graceful degradation**:

1. **Deterministic Fallback (Default):**
   - ChronoAI works immediately out of the box with zero setup.
   - The application clearly displays the badge `⚡ Deterministic Rule Parser (Fallback)`.
   - It parses dates, times, subtasks, effort, and priorities without sending any data over the network.

2. **Connecting Live AI:**
   - Navigate to the **Settings** tab.
   - Choose your provider:
     - **NVIDIA NIM** (Default model: `meta/llama-3.1-70b-instruct`, endpoint: `https://integrate.api.nvidia.com/v1`)
     - **OpenAI** (Default model: `gpt-4o-mini`, endpoint: `https://api.openai.com/v1`)
     - **Custom OpenAI-Compatible API**
   - Enter your API Key and click **"Test API Connection"**.
   - Your API key is stored strictly inside your browser's `localStorage` and is never transmitted to any third party backend.
   - When active, the application displays `✨ AI Powered (Model Name)`.

---

## 💡 Suggested 3-Minute Hackathon Demo Script

1. **The Problem & Dashboard (0:00 – 0:40):**
   - Open `http://127.0.0.1:3000/`.
   - Point out the dynamic greeting and the 4 live summary cards (Due Today, Due This Week, Overdue, Completed).
   - Show the 7-day workload distribution chart showing upcoming preparation demand.
2. **The Extraction Workflow (0:40 – 1:30):**
   - Click **"+ Add from Text"** or **"Import a Deadline"**.
   - Click the sample prompt: *"ML Assignment (Detailed)"* or paste a real announcement.
   - Click **"Extract Deadlines & Plan"**.
   - Highlight how ChronoAI extracted:
     - Title: *Machine Learning Assignment*
     - Deadline: *October 29, 2026, 11:59 PM*
     - Subtasks: Data preprocessing, model training, evaluation, report writing.
     - Pacing Strategy: Switch between *Spaced*, *Early Bird*, and *Intensive*.
   - Click **"Approve & Create Plan"**.
3. **Interactive Calendar & Today's Action (1:30 – 2:20):**
   - Navigate to the **Interactive Calendar** view.
   - Switch between **Month** and **Week** views.
   - Show how deadlines (amber flag) and prep sessions (indigo clock) are placed backward from the deadline.
   - Click any event to open the Task Details modal and inspect subtasks.
4. **Execution & Completion (2:20 – 3:00):**
   - Check off a preparation block directly from **Today's Action Plan** on the dashboard.
   - Mark an assignment complete and see the confetti celebration.
   - Visit **Completed Tasks** to see the logged study hours and achievements.
   - Emphasize the takeaway: *"ChronoAI turns Google Calendar from a passive reminder system into an active preparation coach."*

---

## ⚠️ Known Limitations & Scope

- **Proposed Enhancement vs. Official Product:** ChronoAI is presented as a hackathon prototype demonstrating proposed deadline intelligence for Google Calendar. It is not an official Google product.
- **Internal Calendar Model:** ChronoAI maintains its own internal calendar and state for the MVP. Live two-way OAuth synchronization with Google Calendar accounts is architected as a P2 roadmap enhancement and is not included in this standalone MVP build.
- **Client-Side Secret Handling:** When testing live AI mode, API keys are stored locally in the browser's `localStorage`. In a commercial enterprise release, API calls would route through a secure authenticated proxy.

---

## 📄 License
Built for the Hack to the Future Hackathon. Released under the MIT License.
