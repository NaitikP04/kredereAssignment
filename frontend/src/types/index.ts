export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'email' | 'report' | 'notification';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  // Payload can vary, but we know it's an object. 
  // We can make it more specific later if needed.
  payload: Record<string, any>; 
  result?: Record<string, any>;
  error?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
}

export interface JobStats {
  status: string;
  count: number;
}