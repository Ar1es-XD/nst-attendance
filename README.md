# 🎓 Newton School Attendance Tracker & Planner

A modern, paper-like attendance dashboard and schedule planner designed for Newton School of Technology students. Monitor attendance standing, plan leaves with confidence, run what-if simulations, and generate faculty reference messages in seconds.

![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?style=for-the-badge&logo=vite)

---

## ✨ Key Features

### 📊 Real-Time Academic Tracking
- **Multi-Semester Breakdown**: Automatically pulls your enrolled courses across active semesters.
- **Compliance Health Checks**: Live status indicators highlighting whether individual courses are in Safe, Caution, or Critical attendance territory.
- **Custom Target Controls**: Adjust your target threshold anywhere from 50% to 100% with instant recalculation.

### 🎯 Intelligent Bunk & Class Planner
- **Action Verdict**: Tells you exactly how many lectures you can safely skip while staying above your target.
- **Course-Level Protection**: Explicitly identifies which individual subjects have buffer vs. which courses must be protected to prevent debarment.
- **Upcoming Class Advisory**: Highlights your next upcoming lecture with real-time recommendations.

### 🗓️ Verified Lecture Ledger & Slack Inquiries
- **Chronological Class History**: Detailed timeline of all conducted and upcoming sessions with dates, exact times, topics, and faculty details.
- **Search & Filter**: Filter by missed classes, attended classes, specific subjects, or search lecture topics.
- **1-Click Slack DM Generator**: Copy respectful, human direct messages formatted specifically for Slack to quickly resolve attendance discrepancies with instructors.
- **Dynamic Salutations**: Easily toggle between `Sir` and `Ma'am` addressing styles.
- **Message Temperature Slider**: Tune phrasing tone from crisp formal academic correspondence (0.0) to warm, appreciative direct messages (1.0) with local preference persistence.

### ⚡ Interactive What-If Simulator
- **Course Steppers**: Click `+` or `-` on any course to test future attendance projections.
- **Batch Scenarios**: Simulate universal schedules like attending full days, taking a leave, or entire week projections.
- **Instant Reset**: One-click reset restores live portal figures anytime.

### 📁 Custom Subject Groups
- Group courses into custom categories (e.g., *Core CS Theory*, *Labs & Practicals*, *Electives*) with dedicated group thresholds.

### 🔒 Local-First Privacy
- Zero external databases. Session credentials and local simulations are stored strictly inside your browser (`localStorage`) and never leave your device.

---

## 🚀 Getting Started

### Quick Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173` to explore the sandbox demo or connect your student session.

### 🌐 Deploying to Vercel

Deploy your private attendance dashboard to Vercel in 1 click:

```bash
npx vercel
```

---

## 🧪 Quality & Verification

```bash
npm test        # Runs automated test suites
npm run lint    # Runs fast code linting
npm run build   # Production bundle compilation
```
