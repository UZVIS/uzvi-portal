import React from "react";

interface AttendanceSummaryProps {
  summary: {
    present: number;
    wfh: number;
    leave: number;
    absent: number;
  };
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  summary,
}) => {

  return (

    <div className="attendance-summary">

      <h2 className="section-title">
        Monthly Summary
      </h2>

      <div className="summary-grid">

        <div className="summary-card office">
          <h3>In Office</h3>
          <p>{summary.present}</p>
        </div>

        <div className="summary-card wfh">
          <h3>WFH</h3>
          <p>{summary.wfh}</p>
        </div>

        <div className="summary-card leave">
          <h3>On Leave</h3>
          <p>{summary.leave}</p>
        </div>

        <div className="summary-card absent">
          <h3>Absent</h3>
          <p>{summary.absent}</p>
        </div>

      </div>

    </div>

  );

};

export default AttendanceSummary;