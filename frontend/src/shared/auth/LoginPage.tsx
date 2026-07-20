import {type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError("Enter your employee ID to continue.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(employeeId.trim());
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-panel">
        <div className="login-panel__mark">UZVI</div>
        <p className="login-panel__tag">Employee Self-Management Portal</p>

        <div className="notice-stack" aria-hidden="true">
          <div className="notice-stack__card notice-stack__card--1">
            <span className="notice-stack__eyebrow">Company-wide</span>
            <span className="notice-stack__title">Diwali office closure</span>
          </div>
          <div className="notice-stack__card notice-stack__card--2">
            <span className="notice-stack__eyebrow">Team · Engineering</span>
            <span className="notice-stack__title">
              Sprint review moved to 4 PM
            </span>
          </div>
          <div className="notice-stack__card notice-stack__card--3">
            <span className="notice-stack__eyebrow">Role · Manager</span>
            <span className="notice-stack__title">
              Q3 review cycle opens Monday
            </span>
          </div>
        </div>

        <p className="login-panel__foot">
          Uzvi Services Employee Portal
        </p>
      </aside>

      <main className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h1 className="login-card__title">Sign in</h1>
          <p className="login-card__sub">
            Enter your employee ID to see what's new.
          </p>

          <label className="field" htmlFor="employee_id">
            <span className="field__label">Employee ID</span>
            <input
              id="employee_id"
              className="field__input login-card__id-input"
              placeholder="e.g. E1042"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </label>

          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}

          <button
            className="button-primary login-card__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking…" : "Continue"}
          </button>

          <p className="login-card__note">
            Lightweight sign-in for internal use — no password needed yet.
          </p>
        </form>
      </main>
    </div>
  );
}
