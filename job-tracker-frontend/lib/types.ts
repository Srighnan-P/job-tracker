// ─── Status ───────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Application ──────────────────────────────────────────────────────────────
// Flat shape returned by GET /api/application and GET /api/application/:id
// (backend JOINs jobs + applications into one row)

export interface Application {
  // Application fields
  applicationId: number;
  userId: number;
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // Job fields (joined)
  jobId: number;
  title: string;
  companyName: string;
  location: string | null;
  workMode: string;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string | null;
  jobUrl: string | null;
  source: string | null;
}

// ─── Form Data ────────────────────────────────────────────────────────────────
// Nested shape sent to POST /api/application and PUT /api/application/:id

export interface ApplicationFormData {
  job: {
    title: string;
    companyName: string;
    workMode: string;
    location?: string;
    employmentType?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    description?: string;
    jobUrl?: string;
    source?: string;
  };
  application: {
    status: ApplicationStatus;
    notes?: string;
  };
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApplicationsResponse {
  applications: Application[];
}

export interface ApplicationResponse {
  application: Application;
}

export interface MessageResponse {
  message: string;
}
