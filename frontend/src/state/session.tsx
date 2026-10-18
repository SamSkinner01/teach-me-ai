import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, type Course, type Language, type LessonInfo, type Me, type ModuleInfo, type Progress } from "../api";

interface SessionValue {
  loading: boolean;
  me: Me | null;
  course: Course | null;
  courseError: string | null;
  progress: Progress | null;
  language: Language | null;
  setMe: (me: Me | null) => void;
  refreshMe: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  setProgress: (p: Progress) => void;
  markCheck: (id: string) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    api.course().then(setCourse, (e: ApiError) => setCourseError(e.message));
    api
      .session()
      .then((s) => setMe(s.me), () => setMe(null))
      .finally(() => setMeLoaded(true));
  }, []);

  const refreshProgress = useCallback(async () => {
    try {
      setProgress(await api.progress());
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 409)) setProgress(null);
      else throw e;
    }
  }, []);

  // Load progress whenever the active track changes.
  const activeTrackId = me?.active_track_id ?? null;
  useEffect(() => {
    if (activeTrackId === null) {
      setProgress(null);
      return;
    }
    setProgressLoading(true);
    refreshProgress()
      .catch(() => setProgress(null))
      .finally(() => setProgressLoading(false));
  }, [activeTrackId, refreshProgress]);

  const refreshMe = useCallback(async () => {
    try {
      setMe((await api.session()).me);
    } catch {
      setMe(null);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setMe(null);
    setProgress(null);
  }, []);

  const markCheck = useCallback((id: string) => {
    setProgress((p) => (p && !p.checks.includes(id) ? { ...p, checks: [...p.checks, id] } : p));
    api.completeCheck(id).catch(() => undefined);
  }, []);

  const language = useMemo<Language | null>(() => {
    if (!me || me.active_track_id === null) return null;
    return me.tracks.find((t) => t.id === me.active_track_id)?.language ?? null;
  }, [me]);

  const value: SessionValue = {
    loading: !meLoaded || progressLoading,
    me,
    course,
    courseError,
    progress,
    language,
    setMe,
    refreshMe,
    refreshProgress,
    setProgress,
    markCheck,
    logout,
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}

/** Flattened lesson order with module info, for navigation. */
export interface LessonEntry {
  lesson: LessonInfo;
  module: ModuleInfo;
  index: number;
}

export function lessonEntries(course: Course | null): LessonEntry[] {
  if (!course) return [];
  const out: LessonEntry[] = [];
  for (const module of course.modules) {
    for (const lesson of module.lessons) out.push({ lesson, module, index: out.length });
  }
  return out;
}

export function nextLesson(course: Course | null, progress: Progress | null): LessonEntry | null {
  const entries = lessonEntries(course);
  if (!progress) return entries[0] ?? null;
  return entries.find((e) => !progress.lessons[e.lesson.id]?.completed) ?? null;
}
