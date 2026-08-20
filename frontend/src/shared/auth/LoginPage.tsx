import { type FormEvent, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LogIn, Shield, Lock, Zap, Users } from "lucide-react";

export function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, employee, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/";

  // Already logged in → go to app
  if (!isLoading && employee) {
    return <Navigate to={from} replace />;
  }

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
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1614] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#F37021] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* ─── Left brand panel ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[42%] bg-[#1A1614] flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle orange glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F37021]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#F37021]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-[#F37021] text-white rounded-full flex items-center justify-center font-black text-2xl shadow-lg shadow-[#F37021]/30">
              U
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-tight">
                UZVI PORTAL
              </h1>
              <p className="text-[12px] text-[#F37021] font-bold tracking-wide">
                Employee Portal
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-snug mb-3">
            Welcome back
          </h2>
          <p className="text-gray-400 text-[15px] max-w-sm leading-relaxed">
            Sign in with your employee ID to access leave, calendar,
            announcements, and more.
          </p>
        </div>

        {/* Trust / portal highlights */}
        <div className="relative z-10 space-y-3 mt-12">
          {[
            {
              icon: Lock,
              title: "Secure access",
              desc: "Sign in with your employee ID — internal use only.",
            },
            {
              icon: Zap,
              title: "Self-service workplace",
              desc: "Manage leave, expenses, and day-to-day requests in one place.",
            },
            {
              icon: Users,
              title: "Built for every role",
              desc: "Employee, Manager, HR, and Admin views in a single portal.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5"
            >
              <div className="w-9 h-9 rounded-lg bg-[#F37021]/15 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={18} className="text-[#F37021]" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">
                  {title}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-[12px] text-gray-500 mt-10">
          © {new Date().getFullYear()} Uzvi Services · Internal use only
        </p>
      </aside>

      {/* ─── Right form side ──────────────────────────────────────────── */}
      <main className="flex-1 bg-[#F4F6F8] flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-[#F37021] text-white rounded-full flex items-center justify-center font-black text-xl shadow-md">
              U
            </div>
            <div>
              <h1 className="font-extrabold text-[#1A1614] text-[15px] tracking-wide">
                UZVI PORTAL
              </h1>
              <p className="text-[11px] text-[#F37021] font-bold tracking-wide">
                Employee Portal
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#1A1614] flex items-center justify-center">
                <LogIn size={20} className="text-[#F37021]" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1A1614]">Sign in</h2>
                <p className="text-sm text-gray-500">
                  Enter your employee ID to continue
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="employee_id"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Employee ID
                </label>
                <input
                  id="employee_id"
                  type="text"
                  placeholder="e.g. E1042"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F4F6F8] text-[#1A1614] font-mono text-[15px] font-semibold outline-none focus:border-[#F37021] focus:ring-2 focus:ring-[#F37021]/20 transition placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
                >
                  <Shield size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#F37021] hover:bg-[#e0651c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] shadow-md shadow-[#F37021]/25 transition flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Checking…</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} strokeWidth={2.5} />
                    <span>Continue</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-[12px] text-gray-400">
              Lightweight sign-in for internal use — no password needed yet.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}