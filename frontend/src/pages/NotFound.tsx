import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page page-narrow">
      <div className="card card-pad">
        <h1>Page not found</h1>
        <p className="muted">That page doesn't exist (yet).</p>
        <Link to="/" className="btn btn-primary">
          Go home
        </Link>
      </div>
    </div>
  );
}
