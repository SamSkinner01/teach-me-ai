import { Link } from "react-router-dom";
import { LANGUAGE_NAMES } from "../api";
import { Icon } from "../components/Icon";
import { lessonEntries, nextLesson, useSession } from "../state/session";

export default function Roadmap() {
  const { me, course, progress, language } = useSession();
  if (!course || !progress || !me || !language) {
    return (
      <div className="center-screen">
        <span className="spinner" />
      </div>
    );
  }
  const entries = lessonEntries(course);
  const done = entries.filter((e) => progress.lessons[e.lesson.id]?.completed).length;
  const next = nextLesson(course, progress);
  const pct = entries.length ? Math.round((done / entries.length) * 100) : 0;

  return (
    <div className="page roadmap">
      <section className="roadmap-hero card card-pad">
        <div>
          <span className="eyebrow">{LANGUAGE_NAMES[language]} track</span>
          <h1>{done === 0 ? `Welcome, ${me.user.username}` : `Welcome back, ${me.user.username}`}</h1>
          <div className="roadmap-progress">
            <div className="progress-bar" aria-label={`${pct}% complete`}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <span className="small muted">
              {done} of {entries.length} lessons complete
            </span>
          </div>
        </div>
        {next ? (
          <Link to={`/learn/${next.lesson.id}`} className="btn btn-primary btn-lg">
            {done === 0 ? "Start the course" : "Continue"}: {next.lesson.title} <Icon name="arrowRight" />
          </Link>
        ) : (
          <div className="badge badge-success">
            <Icon name="check" size={12} /> Every available lesson is done. More modules are on the way.
          </div>
        )}
      </section>

      <ol className="modules">
        {course.modules.map((m) => {
          const lessons = m.lessons;
          const mDone = lessons.filter((l) => progress.lessons[l.id]?.completed).length;
          return (
            <li key={m.id} className={`module card ${m.coming_soon ? "soon" : ""}`}>
              <div className="module-head">
                <span className={`module-num ${lessons.length > 0 && mDone === lessons.length ? "done" : ""}`}>
                  {lessons.length > 0 && mDone === lessons.length ? <Icon name="check" size={18} /> : m.number}
                </span>
                <div className="module-title">
                  <h2>
                    {m.title} {m.coming_soon && <span className="badge">coming soon</span>}
                  </h2>
                  <p className="muted small">{m.summary}</p>
                </div>
                {lessons.length > 0 && (
                  <span className="small muted module-count">
                    {mDone}/{lessons.length}
                  </span>
                )}
              </div>
              {lessons.length > 0 ? (
                <ul className="lesson-rows">
                  {lessons.map((l) => {
                    const state = progress.lessons[l.id];
                    const passed = l.exercises.filter((e) => progress.exercises[e.id]?.passed).length;
                    const status = state?.completed ? "done" : state?.unlocked ? "open" : "locked";
                    const body = (
                      <>
                        <span className={`lesson-status ${status}`}>
                          <Icon name={status === "done" ? "check" : status === "open" ? "circle" : "lock"} size={14} />
                        </span>
                        <span className="lesson-row-text">
                          <span className="lesson-row-title">{l.title}</span>
                          <span className="lesson-row-summary small muted">{l.summary}</span>
                        </span>
                        {l.exercises.length > 0 && (
                          <span className="small muted lesson-row-ex">
                            <Icon name="code" size={13} /> {passed}/{l.exercises.length}
                          </span>
                        )}
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {status === "locked" ? (
                          <div className="lesson-row locked" title="Finish the previous lesson to unlock">
                            {body}
                          </div>
                        ) : (
                          <Link to={`/learn/${l.id}`} className={`lesson-row ${status}`}>
                            {body}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="planned">
                  {m.planned.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
