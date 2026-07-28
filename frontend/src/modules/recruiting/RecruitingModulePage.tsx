import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { IconArrowLeft, IconBuilding, IconLogOut } from "./components/icons";
import { initialsOf } from "./stageMeta";
import "./RecruitingModulePage.css";

export interface RecruitingOutletContext {
  openCandidate: (id: string) => void;
}

export default function RecruitingModulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { employee, logout } = useAuth();
  const FIT_SCREEN_PATHS = ["/recruiting", "/recruiting/", "/recruiting/funnel", "/recruiting/sourcing"];
  const HUB_PATHS = ["/recruiting", "/recruiting/"];
  const isHub = FIT_SCREEN_PATHS.includes(location.pathname);
  const isAtHub = HUB_PATHS.includes(location.pathname);

  function handleBack() {
    navigate(isAtHub ? "/" : "/recruiting");
  }

  // Candidate detail now lives at its own route (/recruiting/candidates/:id)
  // rather than an in-shell modal, so "opening" a candidate is just a
  // navigation — every subpage gets this via the outlet context below.
  function openCandidate(id: string) {
    navigate(`/recruiting/candidates/${id}`);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`rec-screen${isHub ? "" : " rec-screen--scrolls"}`}>
      <header className="topbar">
        <div className="topbar__brand-group">
          <button className="topbar__back-btn" onClick={handleBack}>
            <IconArrowLeft size={14} /> Back
          </button>
          <div className="topbar__brand">
            <span className="topbar__brand-icon">
              <IconBuilding size={18} />
            </span>
            UZVI · Recruiting
          </div>
        </div>
        {employee && (
          <div className="topbar__user">
            <div className="topbar__user-info">
              <span className="topbar__user-name">{employee.name}</span>
              <span className="topbar__user-role">{employee.access_tier}</span>
            </div>
            <span className="topbar__avatar">{initialsOf(employee.name)}</span>
            <button className="topbar__logout" onClick={handleLogout}>
              <IconLogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </header>

      <main className={`rec-main${isAtHub ? " rec-main--hub" : ""}`}>
        <Outlet context={{ openCandidate } satisfies RecruitingOutletContext} />
      </main>
    </div>
  );
}