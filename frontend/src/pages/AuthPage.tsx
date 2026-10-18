import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { useSession } from "../state/session";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { me, setMe } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  if (me) return <Navigate to={safeNext ?? "/"} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = mode === "login" ? await api.login(username, password) : await api.register(username, password);
      setMe(result);
      navigate(result.active_track_id === null ? "/start" : (safeNext ?? "/learn"), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";
  return (
    <div className="page page-narrow auth-page">
      <div className="card card-pad">
        <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">
          {isLogin
            ? "Log in to pick up where you left off."
            : "Your progress, code and library are saved to your account."}
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            {!isLogin && <span className="help">3–32 characters: letters, digits, . _ or -</span>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? undefined : 8}
            />
            {!isLogin && <span className="help">At least 8 characters.</span>}
          </div>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={busy}>
            {busy && <span className="spinner" />}
            {isLogin ? "Log in" : "Create account"}
          </button>
        </form>
        <p className="small muted auth-switch">
          {isLogin ? (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
