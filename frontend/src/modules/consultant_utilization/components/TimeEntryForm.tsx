// import { useState } from "react";
// import type { Project } from "../api";
// import "./TimeEntryForm.css";

// interface Props {
//   projects: Project[];
//   onSubmit: (entry: { projectId: string; date: string; hours: number; billable: boolean; notes: string }) => Promise<void>;
// }

// export function TimeEntryForm({ projects, onSubmit }: Props) {
//   const [projectId, setProjectId] = useState(projects[0]?.project_id ?? "");
//   const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
//   const [hours, setHours] = useState("");
//   const [billable, setBillable] = useState(true);
//   const [notes, setNotes] = useState("");
//   const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
//   const [errorMsg, setErrorMsg] = useState("");

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const parsedHours = parseFloat(hours);
//     if (!projectId || !parsedHours || parsedHours <= 0) {
//       setStatus("error");
//       setErrorMsg("Pick a project and enter hours greater than 0.");
//       return;
//     }

//     const dayOfWeek = new Date(date + "T00:00:00").getDay(); // 0=Sun, 6=Sat
//     if (dayOfWeek === 0 || dayOfWeek === 6) {
//       setStatus("error");
//       setErrorMsg("Weekends are not working days. Pick a weekday (Monday-Friday).");
//       return;
//     }
//     setStatus("saving");
//     try {
//       await onSubmit({ projectId, date, hours: parsedHours, billable, notes });
//       setHours("");
//       setNotes("");
//       setStatus("saved");
//     } catch (err) {
//       setStatus("error");
//       setErrorMsg(err instanceof Error ? err.message : "Couldn't save this entry.");
//     }
//   }

//   return (
//     <form className="entry-form" onSubmit={handleSubmit}>
//       <h3 className="entry-form__title">Log hours</h3>

//       <div className="entry-form__row">
//         <label>
//           Project
//           <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
//             {projects.map((p) => (
//               <option key={p.project_id} value={p.project_id}>
//                 {p.name}
//               </option>
//             ))}
//           </select>
//         </label>

//         <label>
//           Date
//           <input
//             type="date"
//             value={date}
//             max={new Date().toISOString().slice(0, 10)}
//             onChange={(e) => setDate(e.target.value)}
//           />
//         </label>

//         <label>
//           Hours
//           <input
//             type="number"
//             min="0"
//             step="0.5"
//             placeholder="0"
//             value={hours}
//             onChange={(e) => setHours(e.target.value)}
//           />
//         </label>
//       </div>

//       <label className="entry-form__checkbox">
//         <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
//         Billable
//       </label>

//       <label className="entry-form__notes">
//         Notes
//         <textarea
//           placeholder="What was this for? (optional)"
//           value={notes}
//           onChange={(e) => setNotes(e.target.value)}
//         />
//       </label>

//       <button type="submit" disabled={status === "saving"}>
//         {status === "saving" ? "Saving…" : "Log hours"}
//       </button>

//       {status === "error" && <p className="entry-form__error">{errorMsg}</p>}
//       {status === "saved" && <p className="entry-form__success">Logged.</p>}
//     </form>
//   );
// }

import { useState, useEffect, useRef } from "react";
import type { Project } from "../api";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "./TimeEntryForm.css";

interface Props {
  projects: Project[];
  onSubmit: (entry: { projectId: string; date: string; hours: number; billable: boolean; notes: string }) => Promise<void>;
}

export function TimeEntryForm({ projects, onSubmit }: Props) {
  const [projectId, setProjectId] = useState(projects[0]?.project_id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const dateInputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (!dateInputRef.current) return;

    flatpickrRef.current = flatpickr(dateInputRef.current, {
      dateFormat: "Y-m-d",
      defaultDate: date,
      maxDate: new Date().toISOString().slice(0, 10),
      disable: [(d) => d.getDay() === 0 || d.getDay() === 6],
      onChange: ([selected]) => {
        if (selected) setDate(selected.toISOString().slice(0, 10));
      },
    });

    return () => {
      flatpickrRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedHours = parseFloat(hours);
    if (!projectId || !parsedHours || parsedHours <= 0) {
      setStatus("error");
      setErrorMsg("Pick a project and enter hours greater than 0.");
      return;
    }

    // Defensive fallback: the date picker already blocks weekend selection,
    // but this guards against any value set outside the picker (e.g. programmatically).
    const dayOfWeek = new Date(date + "T00:00:00").getDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setStatus("error");
      setErrorMsg("Weekends are not working days. Pick a weekday (Monday-Friday).");
      return;
    }

    setStatus("saving");
    try {
      await onSubmit({ projectId, date, hours: parsedHours, billable, notes });
      setHours("");
      setNotes("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't save this entry.");
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <h3 className="entry-form__title">Log hours</h3>

      <div className="entry-form__row">
        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <div className="entry-form__date-wrapper">
            <input
              type="text"
              ref={dateInputRef}
              readOnly
              placeholder="Select a weekday"
              className="entry-form__date-input"
            />
            <span className="entry-form__date-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
          </div>
        </label>

        <label>
          Hours
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </label>
      </div>

      <label className="entry-form__checkbox">
        <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
        Billable
      </label>

      <label className="entry-form__notes">
        Notes
        <textarea
          placeholder="What was this for? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Log hours"}
      </button>

      {status === "error" && <p className="entry-form__error">{errorMsg}</p>}
      {status === "saved" && <p className="entry-form__success">Logged.</p>}
    </form>
  );
}