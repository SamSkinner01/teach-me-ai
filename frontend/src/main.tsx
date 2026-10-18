import "katex/dist/katex.min.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { reloadOnceForNewBuild } from "./components/ErrorBoundary";
import "./styles/global.css";
import "./styles/app.css";
import "./styles/lesson.css";
import "./styles/viz.css";
import "./styles/hljs.css";

// A lazily loaded chunk failed to download (usually: the app was rebuilt while
// this tab was open). Reload once to get the new build instead of erroring.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadOnceForNewBuild()) event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
