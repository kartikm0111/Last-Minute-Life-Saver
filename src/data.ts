import { Task, Habit } from "./types";

export const getInitialTasks = (): Task[] => [
  {
    id: "task-1",
    title: "Monthly Rent & Utility Bill Payment",
    category: "Bill",
    dueDate: "2026-06-23", // Due Today!
    priority: "CRITICAL",
    status: "TODO",
    estimatedHours: 0.5,
    reason: "Due today directly. Overdue will trigger a 5% late surcharge.",
    actionSteps: [
      "Access banking details or utility portal",
      "Confirm amount ($850 rent + $120 power)",
      "Process transfer and download confirmation screenshot"
    ],
    completedSteps: [],
    timeRequiredMinutes: 15
  },
  {
    id: "task-2",
    title: "CS50 Capstone Project Coding & Screencast Submission",
    category: "Assignment",
    dueDate: "2026-06-24", // Tomorrow!
    priority: "HIGH",
    status: "IN_PROGRESS",
    estimatedHours: 8,
    reason: "Hard deadline tomorrow, weighted at 30% of total grade. Essential for graduation.",
    actionSteps: [
      "Complete the SQLite schema index adjustments",
      "Record a 2-minute demo screencast explaining UI interactions",
      "Write README.md with system requirements",
      "Submit zip archive to the academic portal"
    ],
    completedSteps: ["Complete the SQLite schema index adjustments"],
    timeRequiredMinutes: 480
  },
  {
    id: "task-3",
    title: "Google Technical Lead Mock Interview Preparation",
    category: "Interview",
    dueDate: "2026-06-25", // In 2 Days
    priority: "CRITICAL",
    status: "TODO",
    estimatedHours: 4,
    reason: "High stakes mock peer review. If failed, reschedule penalty applies.",
    actionSteps: [
      "Review Heap Sort and Dynamic Programming core visual problems",
      "Do a dry-run mock on 2 Leetcode hard scenarios",
      "Prepare 3 structured behavioral stories under STAR format"
    ],
    completedSteps: [],
    timeRequiredMinutes: 240
  },
  {
    id: "task-4",
    title: "Vehicle Insurance Renewal Policy",
    category: "Bill",
    dueDate: "2026-06-27", // In 4 Days
    priority: "MEDIUM",
    status: "TODO",
    estimatedHours: 1,
    reason: "Policy expires in 4 days. AI recommends locking in competitive pricing early.",
    actionSteps: [
      "Retrieve policy code from old email records",
      "Compare auto-renewal quote with StateFarm alternatives",
      "Authorize card billing of selected plan"
    ],
    completedSteps: [],
    timeRequiredMinutes: 45
  },
  {
    id: "task-5",
    title: "Ship Vibe2Ship Hackathon Project Build!",
    category: "Project",
    dueDate: "2026-06-29", // End of Hackathon
    priority: "HIGH",
    status: "IN_PROGRESS",
    estimatedHours: 12,
    reason: "Submission closes strictly at 2:00 PM on 29th June. AI urges early delivery.",
    actionSteps: [
      "Implement deep Gemini developer SDK integration server-side",
      "Polish the visual typography and interactive framer animations",
      "Deploy live app on Google Cloud Run utilizing AI Studio",
      "Draft presentation writeup and complete evaluation forms"
    ],
    completedSteps: ["Implement deep Gemini developer SDK integration server-side"],
    timeRequiredMinutes: 720
  }
];

export const getInitialHabits = (): Habit[] => [
  {
    id: "habit-1",
    name: "Deep focus hour (No social media)",
    category: "Focus",
    streak: 4,
    completedDays: ["2026-06-22", "2026-06-21", "2026-06-20", "2026-06-19"]
  },
  {
    id: "habit-2",
    name: "Inbox Zero (Daily clean up)",
    category: "Organization",
    streak: 2,
    completedDays: ["2026-06-22", "2026-06-21"]
  },
  {
    id: "habit-3",
    name: "Daily planning review (10 mins)",
    category: "Mindfulness",
    streak: 5,
    completedDays: ["2026-06-22", "2026-06-21", "2026-06-20", "2026-06-19", "2026-06-18"]
  }
];
