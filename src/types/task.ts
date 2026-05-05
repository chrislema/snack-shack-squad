export type TaskStatus = "open" | "in_progress" | "complete" | "cancelled";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  tags: string[];
  scheduled_at: string | null;
  volunteers_needed: number;
  status: TaskStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskClaim {
  id: string;
  task_id: string;
  user_id: string;
  claimed_at: string;
  completed_at: string | null;
}

export interface TaskNote {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
}
