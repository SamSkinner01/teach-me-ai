import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError, LANGUAGE_NAMES, type Language } from "../api";
import { Icon } from "../components/Icon";
import { useSession } from "../state/session";
import { LOGO } from "./Onboarding";

export default function AccountPage() {
  const { me, setMe, logout } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  if (!me) return null;

  const started = new Set(me.tracks.map((t) => t.language));
  const notStarted = (Object.keys(LANGUAGE_NAMES) as Language[]).filter((l) => !started.has(l));

  async function switchTo(id: number) {
    setError(null);
    try {
      setMe(await api.switchTrack(id));
      navigate("/learn");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  async function startNew(lang: Language) {
    if (!window.confirm(`Start a new ${LANGUAGE_NAMES[lang]} track from the beginning? Your other tracks are kept.`)) return;
    try {
      setMe(await api.startTrack(lang));
      navigate("/learn");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  async function deleteAccount() {
    setError(null);
    try {
      await api.deleteAccount(password);
      await logout();
      navigate("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  return (
    <div className="page account-page">
      <header className="page-head">
        <h1>Tracks & account</h1>
        <p className="muted">Signed in as {me.user.username}.</p>
      </header>
      {error && <div className="alert alert-error">{error}</div>}

      <section className="card card-pad">
        <h2>Your tracks</h2>
        <p className="small muted">
          Each language is a separate track with its own progress, code and library. Switching tracks doesn't lose
          anything.
        </p>
        {me.tracks.length === 0 ? (
          <p>
            No tracks yet. <Link to="/start">Choose a language</Link> to begin.
          </p>
        ) : (
          <ul className="track-list">
            {me.tracks.map((t) => {
              const active = t.id === me.active_track_id;
              const pct = Math.round((t.lessons_completed / Math.max(1, me.total_lessons)) * 100);
              return (
                <li key={t.id} className={active ? "active" : ""}>
                  <span className={`lang-logo lang-${t.language}`}>{LOGO[t.language]}</span>
                  <div className="track-info">
                    <strong>{LANGUAGE_NAMES[t.language]}</strong>
                    <div className="progress-bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <span className="small muted">
                      {t.lessons_completed} of {me.total_lessons} lessons · started {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {active ? (
                    <span className="badge badge-accent">current</span>
                  ) : (
                    <button className="btn btn-sm" onClick={() => switchTo(t.id)}>
                      Switch to this track
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {notStarted.length > 0 && me.tracks.length > 0 && (
          <div className="new-track">
            <span className="small muted">Start another language:</span>
            {notStarted.map((l) => (
              <button key={l} className="btn btn-sm" onClick={() => startNew(l)}>
                <Icon name="sparkle" size={14} /> {LANGUAGE_NAMES[l]}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card card-pad danger-zone">
        <h2>Delete account</h2>
        <p className="small muted">This permanently deletes your account, every track, and all your code.</p>
        {confirming ? (
          <form
            className="delete-form"
            onSubmit={(e) => {
              e.preventDefault();
              deleteAccount();
            }}
          >
            <input
              className="input"
              type="password"
              placeholder="Confirm with your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn btn-danger" type="submit">
              Delete everything
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button className="btn btn-danger" onClick={() => setConfirming(true)}>
            <Icon name="trash" size={14} /> Delete my account
          </button>
        )}
      </section>
    </div>
  );
}
