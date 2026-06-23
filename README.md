<div align="center">
  <img width="1200" height="475" alt="Last-Minute Life-Saver Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 🚀 Last-Minute Life-Saver
  
  **Your AI-Powered Crisis Companion & Productivity Command Center**
  
  [![Live App](https://img.shields.io/badge/Live-App-blueviolet?style=for-the-badge&logo=googlecloud)](https://last-minute-life-saver-66486866208.asia-southeast1.run.app)
  [![Vite](https://img.shields.io/badge/Vite-6.2+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
  [![Gemini](https://img.shields.io/badge/Gemini-AI_Studio-F4B400?style=for-the-badge&logo=google)](https://aistudio.google.com/)
</div>

---

> [!IMPORTANT]
> **Stressed about deadlines? Overloaded with tasks? Under-prepared for upcoming goals?** 
> *Last-Minute Life-Saver* is a premium productivity platform built to turn deadline panic into structured, micro-executable action plans. Combining a state-of-the-art web interface with Google's advanced Gemini API, this app is designed to help you execute, stay calm, and meet your goals when the pressure is at its peak.

---

## ✨ Features

### 🌌 1. Aura AI Task Prioritization & Milestones
*   **Intelligent Auditing:** Aura analyzes your entire todo list, deadline distribution, and focus goals.
*   **Micro-Milestones:** High-stakes tasks are automatically broken down into actionable, bite-sized tasks (under 30 minutes) to eliminate starting friction.
*   **Overload Alerts:** Real-time diagnostics flag scheduling conflicts and unrealistic deadlines (e.g., grouping too many high-impact items on the same day).
*   **Resilient Fallback Mode:** Built-in fallback routes to local heuristics in case of network spikes, keeping you productive at all times.

### 🚨 2. Crisis Mode & Quick-Win Action Triggers
*   **Crisis Management Console:** Activate Crisis Mode when a major deadline is looming.
*   **Verbal AI Audio Coaching:** Aura synthesizes encouraging, high-energy coaching audio to settle panic and guide you.
*   **Draft Assistant:** Instantly generates professional deadline extension requests, email templates, study roadmaps, or meeting prep documents copyable to the clipboard.

### 💬 3. Companion Coaching & Interactive Copilot
*   **Direct Chat:** Real-time conversational interface with Aura.
*   **Contextual Understanding:** Discuss tasks, brainstorm solutions, refine schedules, or ask for motivation.
*   **Adaptive Guidance:** Aura keeps answers punchy, strategic, and practical (capped at 120 words for maximum efficiency).

### 📈 4. Habit Analytics & Streak Tracker
*   **Consistencies Engine:** Track core routines (exercise, hydration, study blocks) with visual streak displays.
*   **Micro-interaction Calendars:** Interactive, calendar-style heatmaps log progress.

### 📅 5. Dynamic Agenda & Calendar
*   **Comprehensive Agenda View:** Organize daily workloads, filter by dates, toggle priorities.
*   **Animated Visual Cards:** Built with custom layouts and spring animations that feel incredibly premium and responsive.

---

## 🛠️ Technology Stack

*   **Frontend Library:** React 19 (leveraging hooks, modern routing, and layout optimizations)
*   **Build Tool & Dev Server:** Vite 6
*   **Styling & Design System:** Tailwind CSS v4 (offering ultra-fast compiling and utility optimizations)
*   **Animations:** Motion (Framer Motion v12) for smooth fluid transitions and tactile micro-animations
*   **Backend Server:** Express.js + Node.js (with full TypeScript integration via `tsx`)
*   **AI Integration:** `@google/genai` (Official Google GenAI SDK)
    *   *Text & Layout Models:* `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-2.0-flash-lite` (arranged in automatic fallback queues)
    *   *Text-To-Speech (TTS) Modality:* Voice generation using Gemini's native audio output (`Modality.AUDIO`) with browser speech synthesis fallbacks.

---

## ⚡ Getting Started

### 📋 Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 🔧 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/kartikm0111/Last-Minute-Life-Saver.git
cd Last-Minute-Life-Saver

# Install packages
npm install
```

### 🔑 2. Configure Environment Variables
Create a `.env` file in the root directory and add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```
*(You can get a free API key from [Google AI Studio](https://aistudio.google.com/))*

### 🚀 3. Run Locally

*   **Development Mode:**
    ```bash
    npm run dev
    ```
    This launches the Express server integrated with Vite's development middleware. Open [http://localhost:3000](http://localhost:3000) to view the app.

*   **Production Build:**
    ```bash
    # Build the frontend and bundle the server using esbuild
    npm run build
    
    # Start the production server
    npm run start
    ```

---

## 🌐 Deployment to Google Cloud Run

This application is ready to be dockerized and deployed to Google Cloud Run. 

### `Dockerfile` Example:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "run", "start"]
```

### Deploy using Cloud Build:
```bash
gcloud builds submit --tag gcr.io/your-project-id/last-minute-life-saver
gcloud run deploy last-minute-life-saver --image gcr.io/your-project-id/last-minute-life-saver --platform managed --allow-unauthenticated
```

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by Kartik & Antigravity</sub>
</div>