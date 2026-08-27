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
* **🛡️ Mathematical Planning Engine:**
  * **Bunkable Classes:** Calculates how many classes you can safely miss while staying $\ge 75\%$.
  * **Required Classes:** Calculates how many consecutive classes you must attend to recover if $< 75\%$.
* **🔮 Simulation Mode:** Click `+` or `-` to simulate attending or missing upcoming classes and see projected stats in real time.
* **📁 Custom Subject Groups:** Group multiple courses (e.g. Labs vs. Theory) and assign custom thresholds.
* **🔒 Privacy-Focused:** Authentication tokens are stored exclusively in the user's local browser (`localStorage`) and never saved on external servers.
* **📱 Fully Responsive & Dark Mode:** Designed with a curated HSL color palette and Google's Inter font.

---

## 🐍 Terminal CLI Usage

You can also pull attendance right inside your terminal with zero dependencies:

```bash
python3 attendance.py
```
*(On first run, paste your token once. It saves to `.token` for instant future runs!)*

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React 19 + Vite 8
* **Styling:** Vanilla CSS design system with HSL variables
* **API Reverse Proxy:** Serverless route handler (`api/[...path].js`) and Vite proxy routing to `my.newtonschool.co/api/` without CORS.
