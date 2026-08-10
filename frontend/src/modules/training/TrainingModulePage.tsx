import { useState } from "react";
import "./TrainingModulePage.css";

import TrainingProgramsPage from "./TrainingProgramsPage";
import EnrollmentPage from "./EnrollmentPage";
import ProgressPage from "./ProgressPage";
import UnitCompletionPage from "./UnitCompletionPage";
import { useAuth } from "../../shared/auth/AuthContext";
import { isTrainingAdmin, isTrainingCohortViewer } from "./roles";

export default function TrainingModulePage() {
  const { employee } = useAuth();
  const admin = isTrainingAdmin(employee?.access_tier);
  const cohortViewer = isTrainingCohortViewer(employee?.access_tier);

  const [activeTab, setActiveTab] = useState<
    "programs" | "enrollments" | "completion" | "progress"
  >("programs");

  return (
    <div className="training-page">
      <div className="training-header">
        <div>
          <h1>Training</h1>
          <p>
            {admin
              ? "Define training programs and units, and track progress across the org."
              : cohortViewer
              ? "Enroll employees, oversee completions, and track cohort-wide progress."
              : "View available training programs, enroll, and track your own progress."}
          </p>
        </div>
        {(admin || cohortViewer) && (
          <span className="training-role-badge">{employee?.access_tier} view</span>
        )}
      </div>

      <div className="training-tabs">
        <button
          className={
            activeTab === "programs" ? "active" : ""
          }
          onClick={() => setActiveTab("programs")}
        >
          Programs
        </button>

        <button
          className={
            activeTab === "enrollments" ? "active" : ""
          }
          onClick={() => setActiveTab("enrollments")}
        >
          Enrollments
        </button>

        <button
          className={
            activeTab === "progress" ? "active" : ""
          }
          onClick={() => setActiveTab("progress")}
        >
          Progress
        </button>

        <button
          className={activeTab === "completion" ? "active" : ""}
          onClick={() => setActiveTab("completion")}
        >
          Unit Completion
        </button>
      </div>

      <div className="training-content">
        {activeTab === "programs" && (<TrainingProgramsPage />)}
        {activeTab === "enrollments" && (<EnrollmentPage />)}
        {activeTab === "progress" && (<ProgressPage />)}
        {activeTab === "completion" && (<UnitCompletionPage />)}
        
      </div>
    </div>
  );
}