import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { GlossaryPage } from "./pages/GlossaryPage";
import { Landing } from "./pages/Landing";
import { NotFound } from "./pages/NotFound";
import { Onboarding } from "./pages/Onboarding";
import { SessionProvider, useSession } from "./state/session";
import { ThemeProvider } from "./state/theme";

// Pages that pull in lessons, visualizations or the editor load on demand.
const Roadmap = lazy(() => import("./pages/Roadmap"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));

function Loading() {
  return (
    <div className="center-screen">
      <span className="spinner" />
    </div>
  );
}

/** Requires a logged-in user, and (unless `track` is false) a chosen language. */
function Protected({ children, track = true }: { children: ReactNode; track?: boolean }) {
  const { loading, me, language } = useSession();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (track && !language) return <Navigate to="/start" replace />;
  return <>{children}</>;
}

function Home() {
  const { loading, me, language } = useSession();
  if (loading) return <Loading />;
  if (!me) return <Landing />;
  return <Navigate to={language ? "/learn" : "/start"} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/glossary" element={<GlossaryPage />} />
                <Route
                  path="/start"
                  element={
                    <Protected track={false}>
                      <Onboarding />
                    </Protected>
                  }
                />
                <Route
                  path="/learn"
                  element={
                    <Protected>
                      <Roadmap />
                    </Protected>
                  }
                />
                <Route
                  path="/learn/:lessonId"
                  element={
                    <Protected>
                      <LessonPage />
                    </Protected>
                  }
                />
                <Route
                  path="/library"
                  element={
                    <Protected>
                      <LibraryPage />
                    </Protected>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <Protected track={false}>
                      <AccountPage />
                    </Protected>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}
