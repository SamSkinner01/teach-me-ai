import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LANGUAGE_NAMES } from "../api";
import { useSession } from "../state/session";
import { useTheme, type ThemePref } from "../state/theme";
import { BrandMark, Icon } from "./Icon";

function ThemeToggle() {
  const { pref, setPref } = useTheme();
  const order: ThemePref[] = ["system", "light", "dark"];
  const next = order[(order.indexOf(pref) + 1) % order.length];
  const icon = pref === "system" ? "monitor" : pref === "light" ? "sun" : "moon";
  return (
    <button
      className="btn btn-ghost btn-icon"
      onClick={() => setPref(next)}
      title={`Theme: ${pref} (click for ${next})`}
      aria-label={`Theme: ${pref}. Switch to ${next}.`}
    >
      <Icon name={icon} />
    </button>
  );
}

function UserMenu() {
  const { me, language, logout } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me) return null;
  return (
    <div className="menu" ref={ref}>
      <button className="btn btn-ghost user-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        <Icon name="user" />
        <span className="user-name">{me.user.username}</span>
        {language && <span className="badge badge-accent">{LANGUAGE_NAMES[language]}</span>}
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          <div className="menu-label">Signed in as {me.user.username}</div>
          <Link to="/account" role="menuitem">
            Tracks & account
          </Link>
          <hr />
          <button
            role="menuitem"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { me, language } = useSession();
  const links = me && language
    ? [
        { to: "/learn", label: "Learn" },
        { to: "/library", label: "My library" },
        { to: "/glossary", label: "Glossary" },
      ]
    : [{ to: "/glossary", label: "Glossary" }];

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to={me ? "/learn" : "/"} className="brand">
            <BrandMark className="brand-mark" />
            TEACH-ME-AI
          </Link>
          <nav className="main-nav" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-right">
            <ThemeToggle />
            {me ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Main (mobile)">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main id="main">{children}</main>
    </>
  );
}
