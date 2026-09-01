# 🎓 Newton School Attendance Tracker & Planner

A fast, modern web application and CLI tool that pulls real-time attendance directly from Newton School LMS, calculates bunkable classes, and allows students to simulate future attendance scenarios.

![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?style=for-the-badge&logo=vite)

---

## 🚀 Deploying to Vercel

### Option A: 1-Command CLI Deployment (Fastest)

1. Open your terminal in this project folder:
   ```bash
   npx vercel
   ```
2. Follow the 3-step prompt:
   * **Set up and deploy?** &rarr; `Y`
   * **Which scope?** &rarr; Select your Vercel account
   * **Link to existing project?** &rarr; `N`
   * **Project name?** &rarr; `newton-attendance` (or any name you prefer)
   * **Want to modify settings?** &rarr; `N`
3. Your app is now live at: `https://newton-attendance.vercel.app`! 🎉

---

### Option B: Deploy via GitHub (Recommended for automatic updates)

1. Create a repository on [GitHub](https://github.com/new).
2. Push your project:
   ```bash
   git init
   git add .
   git commit -m "feat: newton school attendance tracker for vercel"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), select your GitHub repository, and click **Deploy**!

---

## ✨ Features

* **🔑 Direct Bearer Token & 🛰️ Network Interceptor:** Connect directly by pasting your Bearer token or by running the real-time DevTools network interceptor to auto-capture session credentials.
* **📊 Comprehensive Subject Breakdown:** Automatically traverses active semesters (e.g. Semester 3 CS) and displays each subject's attendance, percentage, and health status.
* **🛡️ Action Causation Verification Engine:**
  * **Per-Subject Skippability:** Verifies mathematical causation rather than superficial aggregate buffer—identifying specifically which subjects have safe buffer without dropping below $T_{\text{target}}$.
  * **Remaining Lecture Clamping:** Clamps bunkable count against actual scheduled lectures remaining so numbers reflect physical reality.
  * **Restricted Subject Warnings:** Displays exact projected percentage drops (e.g. $83.3\% \to 71.4\%$) if an unsafe class is skipped.
  * **Upcoming Lecture Advisory:** Correlates the immediate upcoming class with course buffer to advise whether it's safe to skip or must be attended.
* **🗓️ Class Attendance Log (Teacher Reference Tab):**
  * Displays full chronological history of conducted and upcoming classes with dates, exact times, lecture topics, course names, and instructor details.
  * Quick status filters (`All`, `Missed Only`, `Attended`) and course filters.
  * **1-Click "Copy for Teacher" Tool:** Generates formatted inquiry reference messages ready to send to faculty for attendance disputes.
  * **Offline / Demo Safety Banner:** Prominently alerts and watermarks records when in simulated fixture mode to prevent citing demo dates to teachers.
* **🔮 Simulation Mode:** Click `+` or `-` to simulate attending or missing upcoming classes and see projected stats in real time.
* **📁 Custom Subject Groups:** Group multiple courses (e.g. Labs vs. Theory) and assign custom thresholds.
* **🧩 Isolated API Adapter Layer:** Defensive adapter (`src/services/lmsAdapter.js`) separating the reverse-engineered LMS API from the UI.
* **🧪 Automated Test Suite:** Native zero-dependency fixture test suite (`npm test`) covering boundary conditions, conflict detection, and clamping.
* **🔒 Privacy-Focused:** Authentication tokens are stored exclusively in the user's local browser (`localStorage`) and never saved on external servers.

---

## 🐍 Terminal CLI Usage

You can also pull attendance right inside your terminal with zero dependencies:

```bash
python3 scripts/attendance.py
```
*(On first run, paste your token once. It saves to `.token` for instant future runs!)*

---

## 🛠️ Tech Stack & Directory Structure

```text
newt_att/
├── scripts/                      # Standalone CLI tools & debug scripts
│   ├── attendance.py             # Zero-dependency terminal attendance tracker
│   ├── get_attendance.js         # Node CLI ledger runner
│   ├── inspect_user.py           # LMS profile inspector
│   └── test_subjects.py          # Course performance debugger
├── src/
│   ├── components/               # Modular UI components
│   │   ├── AttendanceLog/        # Class Attendance Log tab & table
│   │   │   └── AttendanceLogView.jsx
│   │   ├── Dashboard/            # Core dashboard modules
│   │   │   ├── BatchSimulator.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   ├── CourseGrid.jsx
│   │   │   ├── MetricTiles.jsx
│   │   │   └── Toolbar.jsx
│   │   ├── Layout/               # Shell layout components
│   │   │   ├── DemoBanner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── SectionTabs.jsx
│   │   │   └── Ticker.jsx
│   │   └── Modals/               # Modals & entry gateways
│   │       └── ConnectView.jsx
│   ├── services/
│   │   └── lmsAdapter.js         # Isolated LMS API adapter layer
│   ├── utils/
│   │   ├── causationEngine.js    # Per-subject causation verification
│   │   ├── formatters.js         # Date/time & ledger helpers
│   │   └── slackMessageFormatter.js # Human-centric Slack DM generator
│   ├── App.jsx                   # Lean application state orchestrator
│   ├── index.css                 # Flat art design system
│   └── main.jsx                  # React 19 bootstrap
├── test/
│   ├── causation.test.js         # Causation engine test suite
│   └── slackFormatter.test.js    # Slack message formatter test suite
├── package.json
└── vite.config.js
```
