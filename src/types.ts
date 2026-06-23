export type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskCategory = "Assignment" | "Bill" | "Meeting" | "Interview" | "Project" | "General";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string; // ISO string or simple YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  reason?: string; // AI generated priority reasoning
  actionSteps?: string[]; // AI generated checklist/milestones
  completedSteps?: string[]; // list of completed step IDs or text
  timeRequiredMinutes?: number; // AI calculated exact time to finish
}

export interface Recommendation {
  title: string;
  description: string;
  impactType: "FOCUS" | "TIME_SAVER" | "DECISION_MAKING";
}

export interface AIPrioritizationResult {
  prioritizedTasks: Array<{
    id: string;
    priority: TaskPriority;
    reason: string;
    timeRequiredMinutes: number;
    actionSteps: string[];
  }>;
  recommendations: Recommendation[];
  alerts?: string[];
}

export interface AIDraftHelperResult {
  subject: string;
  body: string;
  advisorTip: string;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completedDays: string[]; // array of 'YYYY-MM-DD'
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
