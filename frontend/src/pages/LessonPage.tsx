import type { MDXContent } from "mdx/types";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { Icon } from "../components/Icon";
import { mdxComponents } from "../components/mdx";
import { lessonLoader } from "../lessons";
import { lessonEntries, useSession } from "../state/session";
import { NotFound } from "./NotFound";

export default function LessonPage() {
  const { lessonId = "" } = useParams();
  const { course, progress, setProgress } = useSession();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [Content, setContent] = useState<MDXContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Jump to an #exercise-… anchor once the lesson (and its exercises) have rendered.
  useEffect(() => {
    if (!Content || !hash) return;
    const t = window.setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(), 400);
    return () => window.clearTimeout(t);
  }, [Content, hash]);

  const entries = lessonEntries(course);
  const entry = entries.find((e) => e.lesson.id === lessonId);
  const state = progress?.lessons[lessonId];

  useEffect(() => {
    window.scrollTo(0, 0);
    setContent(null);
    setLoadError(null);
    setCompleteError(null);
    const load = lessonLoader(lessonId);
    if (!load) {
      setLoadError("This lesson's content is missing.");
      return;
    }
    let cancelled = false;
    load().then(
      (mod) => !cancelled && setContent(() => mod.default),
      (e) => !cancelled && setLoadError(String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (!course || !progress) {
    return (
      <div className="center-screen">
        <span className="spinner" />
      </div>
    );
  }
  if (!entry) return <NotFound />;

  const { lesson, module } = entry;
  const prev = entries[entry.index - 1];
  const next = entries[entry.index + 1];
  const remaining = lesson.exercises.filter((e) => !progress.exercises[e.id]?.passed);

  if (!state?.unlocked) {
    return (
      <div className="page page-narrow">
        <div className="card card-pad locked-lesson">
          <Icon name="lock" size={28} />
          <h1>{lesson.title}</h1>
          <p className="muted">Finish {prev ? `“${prev.lesson.title}”` : "the previous lesson"} to unlock this one.</p>
          <Link to={prev ? `/learn/${prev.lesson.id}` : "/learn"} className="btn btn-primary">
            Go to {prev ? prev.lesson.title : "the course"}
          </Link>
        </div>
      </div>
    );
  }

  async function complete() {
    setCompleting(true);
    setCompleteError(null);
    try {
      setProgress(await api.completeLesson(lessonId));
      if (next && !next.module.coming_soon) navigate(`/learn/${next.lesson.id}`);
      else navigate("/learn");
    } catch (e) {
      setCompleteError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="lesson-layout">
      <aside className="lesson-sidebar" aria-label={`${module.title} lessons`}>
        <Link to="/learn" className="sidebar-back small">
          <Icon name="chevronLeft" size={14} /> All modules
        </Link>
        <div className="sidebar-module">
          <span className="eyebrow">Module {module.number}</span>
          <strong>{module.title}</strong>
        </div>
        <ol className="sidebar-lessons">
          {module.lessons.map((l) => {
            const s = progress.lessons[l.id];
            const status = s?.completed ? "done" : s?.unlocked ? "open" : "locked";
            return (
              <li key={l.id}>
                {status === "locked" ? (
                  <span className="sidebar-lesson locked">
                    <Icon name="lock" size={13} /> {l.title}
                  </span>
                ) : (
                  <Link to={`/learn/${l.id}`} className={`sidebar-lesson ${status} ${l.id === lessonId ? "current" : ""}`}>
                    <Icon name={status === "done" ? "check" : "circle"} size={13} /> {l.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </aside>

      <article className="lesson">
        <header className="lesson-header">
          <span className="eyebrow">
            Module {module.number} · {module.title}
          </span>
          <h1>{lesson.title}</h1>
          <p className="lead muted">{lesson.summary}</p>
        </header>

        <div className="prose">
          {loadError ? (
            <div className="alert alert-error">{loadError}</div>
          ) : Content ? (
            <Content components={mdxComponents} />
          ) : (
            <div className="center-screen">
              <span className="spinner" />
            </div>
          )}
        </div>

        <footer className="lesson-footer card card-pad">
          {state.completed ? (
            <div className="lesson-done">
              <span className="badge badge-success">
                <Icon name="check" size={12} /> Lesson complete
              </span>
              {next && !next.module.coming_soon ? (
                <Link to={`/learn/${next.lesson.id}`} className="btn btn-primary">
                  Next: {next.lesson.title} <Icon name="arrowRight" />
                </Link>
              ) : (
                <Link to="/learn" className="btn btn-primary">
                  Back to the course
                </Link>
              )}
            </div>
          ) : remaining.length > 0 ? (
            <div>
              <strong>
                Pass {remaining.length === lesson.exercises.length ? "the" : "the remaining"} exercise
                {remaining.length === 1 ? "" : "s"} to finish this lesson
              </strong>
              <ul className="remaining">
                {remaining.map((e) => (
                  <li key={e.id}>
                    <a href={`#exercise-${e.id}`}>{e.title}</a> <code>{e.function}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="lesson-done">
              <div>
                <strong>{lesson.exercises.length ? "All exercises passed." : "Done reading?"}</strong>
                <p className="small muted">
                  {next && !next.module.coming_soon ? `Next up: ${next.lesson.title}.` : "That's the end of the available lessons."}
                </p>
              </div>
              <button className="btn btn-primary btn-lg" onClick={complete} disabled={completing}>
                {completing && <span className="spinner" />} Complete lesson <Icon name="check" />
              </button>
            </div>
          )}
          {completeError && <div className="alert alert-error">{completeError}</div>}
        </footer>

        <nav className="lesson-nav">
          {prev ? (
            <Link to={`/learn/${prev.lesson.id}`} className="btn btn-ghost">
              <Icon name="chevronLeft" /> {prev.lesson.title}
            </Link>
          ) : (
            <span />
          )}
          {next && progress.lessons[next.lesson.id]?.unlocked && (
            <Link to={`/learn/${next.lesson.id}`} className="btn btn-ghost">
              {next.lesson.title} <Icon name="chevronRight" />
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
}
