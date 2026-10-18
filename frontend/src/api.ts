// Typed client for the backend API (see backend/app/main.py).

export type Language = "python" | "rust" | "cpp";

export const LANGUAGE_NAMES: Record<Language, string> = {
  python: "Python",
  rust: "Rust",
  cpp: "C++",
};

export interface Track {
  id: number;
  language: Language;
  created_at: string;
  lessons_completed: number;
}

export interface Me {
  user: { id: number; username: string };
  active_track_id: number | null;
  tracks: Track[];
  total_lessons: number;
}

export interface ExerciseRef {
  id: string;
  title: string;
  function: string;
}

export interface LessonInfo {
  id: string;
  title: string;
  summary: string;
  exercises: ExerciseRef[];
}

export interface ModuleInfo {
  id: string;
  number: number;
  title: string;
  summary: string;
  coming_soon: boolean;
  planned: string[];
  lessons: LessonInfo[];
}

export interface Course {
  languages: { id: Language; name: string }[];
  modules: ModuleInfo[];
}

export interface Progress {
  track: { id: number; language: Language };
  lessons: Record<string, { completed: boolean; unlocked: boolean }>;
  exercises: Record<string, { passed: boolean; attempts: number }>;
  checks: string[];
}

export type ArgValue = unknown;

export interface VisibleTest {
  index: number;
  description: string;
  args: ArgValue[];
  expected: unknown;
  expect_error: boolean;
}

export interface Param {
  name: string;
  type: string;
}

export interface ExerciseData {
  id: string;
  title: string;
  lesson_id: string;
  language: Language;
  function: string;
  params: Param[];
  returns: string;
  starter: string;
  code: string;
  tests: VisibleTest[];
  hidden_count: number;
  hints: string[];
  library: string[];
  passed: boolean;
  attempts: number;
  solution_available: boolean;
}

export type TestStatus = "pass" | "fail" | "error" | "not_run";

export interface TestOutcome {
  index: number;
  description: string;
  hidden: boolean;
  status: TestStatus;
  message: string;
  detail: string;
  args: ArgValue[] | null;
  expected: unknown;
  expect_error: boolean;
  actual: unknown;
}

export type ReportStatus = "passed" | "failed" | "compile_error" | "load_error" | "crashed" | "timeout";

export interface Report {
  status: ReportStatus;
  passed: number;
  total: number;
  tests: TestOutcome[];
  compile_output: string;
  stdout: string;
  stderr: string;
  message: string;
  time_ms: number;
  used_reference: string[];
}

export interface RunResponse {
  report: Report;
  submitted: boolean;
  passed: boolean;
  attempts: number;
  solution_available: boolean;
}

export interface Submission {
  id: number;
  code: string;
  status: ReportStatus;
  passed: number;
  total: number;
  created_at: string;
}

export interface LibraryFunction {
  exercise_id: string;
  title: string;
  function: string;
  lesson_id: string;
  code: string | null;
  passed_at: string | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, credentials: "same-origin", headers: {} };
  if (method !== "GET") {
    // The API only accepts JSON for writes (it's how it blocks CSRF).
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body ?? {});
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that the backend is running.");
  }
  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail)) message = data.detail.map((d: { msg: string }) => d.msg).join("; ");
    } catch {
      // keep the status text
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<Me>("GET", "/auth/me"),
  session: () => request<{ me: Me | null }>("GET", "/auth/session"),
  register: (username: string, password: string) => request<Me>("POST", "/auth/register", { username, password }),
  login: (username: string, password: string) => request<Me>("POST", "/auth/login", { username, password }),
  logout: () => request<{ ok: boolean }>("POST", "/auth/logout"),
  deleteAccount: (password: string) => request<{ ok: boolean }>("POST", "/auth/delete", { password }),

  course: () => request<Course>("GET", "/course"),
  startTrack: (language: Language) => request<Me>("POST", "/tracks", { language }),
  switchTrack: (trackId: number) => request<Me>("PUT", "/tracks/active", { track_id: trackId }),
  progress: () => request<Progress>("GET", "/progress"),
  completeLesson: (lessonId: string) => request<Progress>("POST", `/lessons/${lessonId}/complete`),
  completeCheck: (checkId: string) => request<{ ok: boolean }>("POST", `/checks/${checkId}/complete`),

  exercise: (id: string) => request<ExerciseData>("GET", `/exercises/${id}`),
  saveDraft: (id: string, code: string) => request<{ ok: boolean }>("PUT", `/exercises/${id}/draft`, { code }),
  run: (id: string, code: string) => request<RunResponse>("POST", `/exercises/${id}/run`, { code }),
  submit: (id: string, code: string) => request<RunResponse>("POST", `/exercises/${id}/submit`, { code }),
  submissions: (id: string) => request<Submission[]>("GET", `/exercises/${id}/submissions`),
  solution: (id: string) => request<{ code: string }>("GET", `/exercises/${id}/solution`),
  library: () => request<{ language: Language; functions: LibraryFunction[] }>("GET", "/library"),
};
