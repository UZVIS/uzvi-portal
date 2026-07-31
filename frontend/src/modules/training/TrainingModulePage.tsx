import { useState } from "react";
import "./TrainingModulePage.css";

import TrainingProgramsPage from "./TrainingProgramsPage";
import EnrollmentPage from "./EnrollmentPage";
import ProgressPage from "./ProgressPage";
import UnitCompletionPage from "./UnitCompletionPage";

export default function TrainingModulePage() {
  const [activeTab, setActiveTab] = useState<
    "programs" | "enrollments" | "completion" | "progress"
  >("programs");

  return (
    <div className="training-page">
      <div className="training-header">
        <div>
          <h1>Training</h1>
          <p>
            Manage training programs, enroll employees, and
            track training progress.
          </p>
        </div>
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