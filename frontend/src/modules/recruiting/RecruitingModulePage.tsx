import { Outlet, useNavigate } from "react-router-dom";
import "./RecruitingModulePage.css";

export interface RecruitingOutletContext {
  openCandidate: (id: string) => void;
}

export default function RecruitingModulePage() {
  const navigate = useNavigate();
  
  // Candidate detail lives at /recruiting/candidates/:id
  function openCandidate(id: string) {
    navigate(`/recruiting/candidates/${id}`);
  }

  return (
    <div className="rec-shell">
      <Outlet context={{ openCandidate } satisfies RecruitingOutletContext} />
    </div>
  );
}