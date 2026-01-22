export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'email' | 'report' | 'notification';
export type Priority = 1 | 2 | 3 | 4 | 5;

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface ReportPayload {
  report_type: string;
  format: 'pdf' | 'csv';
  date_range?: {
    start: string;
    end: string;
  };
}

export interface NotificationPayload {
  user_id: string;
  channel: 'push' | 'sms' | 'email';
  message: string;
}

export type JobPayload = EmailPayload | ReportPayload | NotificationPayload;

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: Priority;
  payload: JobPayload;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
  completed_at?: string;
}

export interface JobStats {
  status: string;
  count: number;
}