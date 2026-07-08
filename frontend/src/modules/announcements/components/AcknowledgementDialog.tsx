import { useState } from "react";

interface Props {
  announcementId: number;
  onSubmit: (
    announcementId: number,
    employeeId: string
  ) => void;
}

export default function AcknowledgementDialog({
  announcementId,
  onSubmit,
}: Props) {

  const [employeeId, setEmployeeId] =
    useState("");

  return (
    <div
      style={{
        border: "1px solid gray",
        padding: 20,
        marginTop: 20,
      }}
    >
      <h3>Acknowledge Announcement</h3>

      <input
        placeholder="Employee ID"
        value={employeeId}
        onChange={(e) =>
          setEmployeeId(e.target.value)
        }
      />

      <button
        onClick={() =>
          onSubmit(
            announcementId,
            employeeId
          )
        }
      >
        Acknowledge
      </button>
    </div>
  );
}