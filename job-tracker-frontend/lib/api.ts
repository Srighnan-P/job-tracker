import axios from "axios";
import type {
  AuthResponse,
  ApplicationsResponse,
  ApplicationResponse,
  MessageResponse,
  ApplicationFormData,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

// ─── snake_case → camelCase transform ─────────────────────────────────────────

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function keysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamel(k),
        keysToCamel(v),
      ])
    );
  }
  return obj;
}

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use((response) => {
  response.data = keysToCamel(response.data);
  return response;
});

// ─── Auth (/api/auth) ─────────────────────────────────────────────────────────

export const auth = {
  register(name: string, email: string, password: string) {
    return api
      .post<AuthResponse>("/api/auth/register", { name, email, password })
      .then((r) => r.data);
  },

  login(email: string, password: string) {
    return api
      .post<AuthResponse>("/api/auth/login", { email, password })
      .then((r) => r.data);
  },

  logout() {
    return api.post<MessageResponse>("/api/auth/logout").then((r) => r.data);
  },

  me() {
    return api
      .get<AuthResponse>("/api/auth/me")
      .then((r) => r.data);
  },
};

// ─── Applications (/api/application) ─────────────────────────────────────────

export const applications = {
  getAll() {
    return api.get<ApplicationsResponse>("/api/application").then((r) => r.data);
  },

  getById(id: number) {
    return api
      .get<ApplicationResponse>(`/api/application/${id}`)
      .then((r) => r.data);
  },

  create(data: ApplicationFormData) {
    return api
      .post<ApplicationResponse>("/api/application", data)
      .then((r) => r.data);
  },

  update(id: number, data: Partial<ApplicationFormData>) {
    return api
      .put<ApplicationResponse>(`/api/application/${id}`, data)
      .then((r) => r.data);
  },

  delete(id: number) {
    return api
      .delete<MessageResponse>(`/api/application/${id}`)
      .then((r) => r.data);
  },
};
