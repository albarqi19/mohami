// User roles and permissions
export interface User {
  id: string;
  name: string;
  nationalId: string;
  email?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export const UserRole = {
  ADMIN: "admin",
  LAWYER: "lawyer",
  LEGAL_ASSISTANT: "legal_assistant",
  CLIENT: "client"
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Case management
export interface Case {
  id: string;
  file_number: string;
  title: string;
  client_name: string;
  client_id: string;
  client_phone?: string;
  client_email?: string;
  opponent_name?: string;
  court?: string;
  case_type: CaseType;
  status: CaseStatus;
  priority: Priority;
  assignedLawyers?: string[];
  lawyers?: User[];
  description?: string;
  created_at: Date;
  updated_at: Date;
  filing_date?: Date;
  due_date?: Date;
  next_hearing?: Date;
  contract_value?: number;
  documents?: Document[];
  tasks?: Task[];
  activities?: Activity[];
}

export const CaseType = {
  CIVIL: "civil",
  CRIMINAL: "criminal",
  COMMERCIAL: "commercial",
  FAMILY: "family",
  LABOR: "labor",
  ADMINISTRATIVE: "administrative",
  REAL_ESTATE: "real_estate",
  INTELLECTUAL_PROPERTY: "intellectual_property",
  OTHER: "other"
} as const;

export type CaseType = typeof CaseType[keyof typeof CaseType];

export const CaseStatus = {
  ACTIVE: "active",
  PENDING: "pending",
  CLOSED: "closed",
  APPEALED: "appealed",
  SETTLED: "settled",
  DISMISSED: "dismissed"
} as const;

export type CaseStatus = typeof CaseStatus[keyof typeof CaseStatus];

// Task Types
export const TaskType = {
  REVIEW: "review",
  RESEARCH: "research",
  CONSULTATION: "consultation",
  COURT: "court",
  DOCUMENT: "document",
  MEETING: "meeting",
  OTHER: "other"
} as const;

export type TaskType = typeof TaskType[keyof typeof TaskType];

// Task management
export interface Task {
  id: string;
  title: string;
  description?: string;
  type?: TaskType;
  caseId?: string;
  assignedTo: string;
  assignedBy: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  documents: Document[];
  comments: Comment[];
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  notes?: string;
}

export const TaskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  OVERDUE: "overdue",
  ARCHIVED: "archived"
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const Priority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent"
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

// Document management
export interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: DocumentCategory;
  case_id?: string;
  task_id?: string;
  uploaded_by: string;
  uploaded_at: string;
  is_confidential: boolean;
  version: number;
  tags: string[];
  case?: Case;
  task?: Task;
  uploader?: User;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  caseId?: string;
  taskId?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
  isConfidential?: boolean;
  url?: string;
  relatedCaseId?: string;
  relatedTaskId?: string;
}

export const DocumentCategory = {
  CONTRACT: "contract",
  EVIDENCE: "evidence",
  PLEADING: "pleading",
  CORRESPONDENCE: "correspondence",
  REPORT: "report",
  JUDGMENT: "judgment",
  OTHER: "other"
} as const;

export type DocumentCategory = typeof DocumentCategory[keyof typeof DocumentCategory];

// Activity and timeline
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  caseId?: string;
  taskId?: string;
  performedBy: string;
  performedAt: Date;
  metadata?: Record<string, any>;
}

export const ActivityType = {
  CASE_CREATED: "case_created",
  CASE_UPDATED: "case_updated",
  TASK_CREATED: "task_created",
  TASK_ASSIGNED: "task_assigned",
  TASK_UPDATED: "task_updated",
  TASK_COMPLETED: "task_completed",
  DOCUMENT_UPLOADED: "document_uploaded",
  COMMENT_ADDED: "comment_added",
  HEARING_SCHEDULED: "hearing_scheduled",
  STATUS_CHANGED: "status_changed",
  USER_ASSIGNED: "user_assigned",
  CLIENT_MEETING: "client_meeting",
  MESSAGE_SENT: "message_sent"
} as const;

export type ActivityType = typeof ActivityType[keyof typeof ActivityType];

// Comments and communication
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  caseId?: string;
  taskId?: string;
  createdAt: Date;
  updatedAt?: Date;
  isInternal: boolean;
  attachments: Document[];
}

// Task Comments
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskCommentForm {
  comment: string;
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export const NotificationType = {
  TASK_ASSIGNED: "task_assigned",
  TASK_DUE: "task_due",
  CASE_UPDATE: "case_update",
  DOCUMENT_SHARED: "document_shared",
  HEARING_REMINDER: "hearing_reminder",
  SYSTEM: "system"
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// Reports and analytics
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalTasks: number;
  overdueTasks: number;
  completedTasksThisMonth: number;
  upcomingHearings: number;
  userPerformance: UserPerformanceStats[];
}

export interface UserPerformanceStats {
  userId: string;
  userName: string;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  caseLoad: number;
}

// Settings and preferences
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "ar" | "en";
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    hearingReminders: boolean;
  };
  dashboard: {
    defaultView: string;
    widgets: string[];
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form types
export interface CreateCaseForm {
  title: string;
  clientName: string;
  clientId: string;
  opponentName?: string;
  court?: string;
  caseType: CaseType;
  priority: Priority;
  assignedLawyers: string[];
  description?: string;
  dueDate?: Date;
  nextHearing?: Date;
  estimatedValue?: number;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  type?: string;
  caseId?: string;
  assignedTo: string;
  priority: Priority;
  dueDate?: Date;
  estimatedHours?: number;
}

export interface LoginForm {
  nationalId: string;
  pin: string;
  rememberMe?: boolean;
}

// Appointment types
export interface Appointment {
  id: string;
  case_id: string;
  title: string;
  description?: string;
  type: AppointmentType;
  scheduled_at: Date;
  duration_minutes: number;
  location?: string;
  attendees?: string[];
  status: AppointmentStatus;
  priority: Priority;
  notes?: string;
  reminders?: string[];
  reminder_sent_at?: Date;
  outcome?: string;
  documents?: string[];
  created_by: string;
  assigned_to?: string;
  rescheduled_from?: Date;
  cancellation_reason?: string;
  created_at: Date;
  updated_at: Date;
  creator?: User;
  assignee?: User;
  case?: Case;
}

export type AppointmentType =
  | "court_hearing"
  | "client_meeting"
  | "team_meeting"
  | "document_filing"
  | "arbitration"
  | "consultation"
  | "mediation"
  | "settlement"
  | "other";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed"
  | "no_show";

export interface CreateAppointmentForm {
  case_id: string;
  title: string;
  description?: string;
  type: AppointmentType;
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
  attendees?: string[];
  priority?: Priority;
  notes?: string;
  reminders?: string[];
  assigned_to?: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  activeCases: number;
  lastInteraction?: string;
  preferredChannel?: "whatsapp" | "email" | "phone";
  notes?: string;
}
