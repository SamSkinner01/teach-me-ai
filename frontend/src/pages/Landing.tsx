import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { useSession } from "../state/session";
import { DigitDemo } from "../viz/DigitDemo";

const FEATURES = [
  {
    icon: "eye",
    title: "Math you can see",
    text: "Drag vectors, warp grids with matrices, slide secant lines into tangents and watch gradients flow backwards through a network.",
  },
  {
    icon: "code",
    title: "Code you write",
    text: "Every idea becomes a function you implement and test in your browser, using only your language's standard library. No NumPy, no PyTorch.",
  },
  {
    icon: "grid",
    title: "A real CNN at the end",
    text: "Your functions add up to a library, and the library becomes a convolutional neural network that reads handwritten digits.",
  },
];

export function Landing() {
  const { course } = useSession();
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">Linear algebra · Calculus · Neural networks</span>
          <h1>
            Learn the math behind AI.
            <br />
            Then build a neural network <em>from scratch</em>.
          </h1>
          <p className="lead">
            An interactive course that starts with vectors and ends with a convolutional neural network you wrote
            yourself, in <strong>Python</strong>, <strong>Rust</strong> or <strong>C++</strong>, trained on MNIST.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start learning <Icon name="arrowRight" />
            </Link>
            <Link to="/login" className="btn btn-lg">
              I have an account
            </Link>
          </div>
        </div>
        <div className="hero-demo">
          <DigitDemo compact />
          <p className="small muted hero-demo-note">
            Go on, draw something. By the end of the course you'll have built a network like this one.
          </p>
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature card card-pad">
            <span className="feature-icon">
              <Icon name={f.icon} size={20} />
            </span>
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </div>
        ))}
      </section>

      {course && (
        <section className="curriculum">
          <h2>The path</h2>
          <ol className="curriculum-list">
            {course.modules.map((m) => (
              <li key={m.id} className={m.coming_soon ? "soon" : ""}>
                <span className="curriculum-num">{m.number}</span>
                <div>
                  <strong>{m.title}</strong>
                  {m.coming_soon && <span className="badge">coming soon</span>}
                  <p className="small muted">{m.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
