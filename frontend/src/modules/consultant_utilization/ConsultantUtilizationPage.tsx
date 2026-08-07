// import { useEffect, useState } from "react";
// import { utilizationApi, type Project, type PersonalDashboard, type TimeEntry } from "./api";
// import { useAuth } from "../../shared/auth/AuthContext";
// import { UtilizationSummaryCard } from "./components/UtilizationSummaryCard";
// import { TimeEntryForm } from "./components/TimeEntryForm";
// import "./ConsultantUtilizationPage.css";

// function isoDateNDaysAgo(n: number): string {
//   const d = new Date();
//   d.setDate(d.getDate() - n);
//   return d.toISOString().slice(0, 10);
// }

// export function ConsultantUtilizationPage() {
//   const { employee } = useAuth();
//   const currentEmployeeId = employee?.employee_id ?? "";

//   const [projects, setProjects] = useState<Project[]>([]);
//   const [dashboard, setDashboard] = useState<PersonalDashboard | null>(null);
//   const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState<string | null>(null);

//   const periodStart = isoDateNDaysAgo(7);
//   const periodEnd = isoDateNDaysAgo(0);

//   async function loadDashboard() {
//     const [projectList, personalDashboard, entries] = await Promise.all([
//       utilizationApi.listProjects(),
//       utilizationApi.getPersonalDashboard(currentEmployeeId, periodStart, periodEnd),
//       utilizationApi.listTimeEntries(currentEmployeeId, periodStart, periodEnd),
//     ]);
//     setProjects(projectList);
//     setDashboard(personalDashboard);
//     // Most recent first.
//     setRecentEntries([...entries].sort((a, b) => (a.date < b.date ? 1 : -1)));
//   }

//   useEffect(() => {
//     if (!currentEmployeeId) return;
//     setLoading(true);
//     loadDashboard()
//       .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load your dashboard."))
//       .finally(() => setLoading(false));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentEmployeeId]);

//   async function handleLogHours(entry: { projectId: string; date: string; hours: number; billable: boolean; notes: string }) {
//     await utilizationApi.createTimeEntry({
//       entry_id: `TE-${currentEmployeeId}-${entry.projectId}-${entry.date}-${Date.now()}`,
//       employee_id: currentEmployeeId,
//       project_id: entry.projectId,
//       date: entry.date,
//       hours: entry.hours,
//       billable_flag: entry.billable,
//       notes: entry.notes || undefined,
//     });
//     await loadDashboard(); // refresh summary + trend after logging
//   }

//   if (!currentEmployeeId || loading) {
//     return <div className="cu-page cu-page--status">Loading your utilization…</div>;
//   }

//   if (loadError) {
//     return <div className="cu-page cu-page--status cu-page--error">Couldn't load this page: {loadError}</div>;
//   }

//   if (!dashboard) {
//     return null;
//   }

//   const projectRows = (Object.entries(dashboard.hours_by_project) as [string, number][]).sort(
//     (a, b) => b[1] - a[1]
//   );
//   const trendRows = (Object.entries(dashboard.weekly_trend) as [string, number][]).sort((a, b) =>
//     a[0] > b[0] ? 1 : -1
//   );
//   const maxTrendHours = Math.max(1, ...trendRows.map(([, hours]) => hours));

//   return (
//     <div className="cu-page">
//       <h1 className="cu-page__title">Consultant Utilization</h1>
//       <p className="cu-page__subtitle">
//         Last 7 days · {periodStart} to {periodEnd}
//       </p>

//       <UtilizationSummaryCard summary={dashboard.summary} />

//       <div className="cu-page__grid">
//         <section className="cu-panel">
//           <h2 className="cu-panel__title">Hours by project</h2>
//           {projectRows.length === 0 ? (
//             <p className="cu-panel__empty">No hours logged in this period yet.</p>
//           ) : (
//             <table className="cu-table">
//               <thead>
//                 <tr>
//                   <th>Project</th>
//                   <th>Hours</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {projectRows.map(([projectId, hours]) => (
//                   <tr key={projectId}>
//                     <td>{projects.find((p: Project) => p.project_id === projectId)?.name ?? projectId}</td>
//                     <td>{hours.toFixed(1)}h</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </section>

//         <section className="cu-panel">
//           <h2 className="cu-panel__title">Weekly trend</h2>
//           {trendRows.length === 0 ? (
//             <p className="cu-panel__empty">Nothing to trend yet.</p>
//           ) : (
//             <div className="cu-trend">
//               {trendRows.map(([week, hours]) => (
//                 <div className="cu-trend__row" key={week}>
//                   <span className="cu-trend__label">{week}</span>
//                   <div className="cu-trend__bar-track">
//                     <div className="cu-trend__bar" style={{ width: `${(hours / maxTrendHours) * 100}%` }} />
//                   </div>
//                   <span className="cu-trend__value">{hours.toFixed(1)}h</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>

//       <TimeEntryForm projects={projects} onSubmit={handleLogHours} />

//       <section className="cu-panel cu-panel--entries">
//         <h2 className="cu-panel__title">Recent entries</h2>
//         {recentEntries.length === 0 ? (
//           <p className="cu-panel__empty">No entries logged in this period yet.</p>
//         ) : (
//           <table className="cu-table cu-table--entries">
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Project</th>
//                 <th>Hours</th>
//                 <th>Billable</th>
//                 <th>Notes</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentEntries.map((entry) => (
//                 <tr key={entry.entry_id}>
//                   <td>{entry.date}</td>
//                   <td>{projects.find((p: Project) => p.project_id === entry.project_id)?.name ?? entry.project_id}</td>
//                   <td>{entry.hours.toFixed(1)}h</td>
//                   <td>{entry.billable_flag ? "Yes" : "No"}</td>
//                   <td className="cu-table__notes" title={entry.notes ?? undefined}>
//                     {entry.notes ? entry.notes : <span className="cu-panel__empty-inline">—</span>}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </section>
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { utilizationApi, OvertimeConfirmationError, type Project, type PersonalDashboard, type TimeEntry } from "./api";
// import { useAuth } from "../../shared/auth/AuthContext";
// import { UtilizationSummaryCard } from "./components/UtilizationSummaryCard";
// import { TimeEntryForm } from "./components/TimeEntryForm";
// import "./ConsultantUtilizationPage.css";

// function isoDateNDaysAgo(n: number): string {
//   const d = new Date();
//   d.setDate(d.getDate() - n);
//   return d.toISOString().slice(0, 10);
// }

// export function ConsultantUtilizationPage() {
//   const { employee } = useAuth();
//   const currentEmployeeId = employee?.employee_id ?? "";

//   const [projects, setProjects] = useState<Project[]>([]);
//   const [dashboard, setDashboard] = useState<PersonalDashboard | null>(null);
//   const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState<string | null>(null);

//   const periodStart = isoDateNDaysAgo(7);
//   const periodEnd = isoDateNDaysAgo(0);

//   async function loadDashboard() {
//     const [projectList, personalDashboard, entries] = await Promise.all([
//       utilizationApi.listProjects(),
//       utilizationApi.getPersonalDashboard(currentEmployeeId, periodStart, periodEnd),
//       utilizationApi.listTimeEntries(currentEmployeeId, periodStart, periodEnd),
//     ]);
//     setProjects(projectList);
//     setDashboard(personalDashboard);
//     // Most recent first.
//     setRecentEntries([...entries].sort((a, b) => (a.date < b.date ? 1 : -1)));
//   }

//   useEffect(() => {
//     if (!currentEmployeeId) return;
//     setLoading(true);
//     loadDashboard()
//       .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load your dashboard."))
//       .finally(() => setLoading(false));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentEmployeeId]);

//   async function handleLogHours(entry: { projectId: string; date: string; hours: number; billable: boolean; notes: string }) {
//     const baseEntry = {
//       entry_id: `TE-${currentEmployeeId}-${entry.projectId}-${entry.date}-${Date.now()}`,
//       employee_id: currentEmployeeId,
//       project_id: entry.projectId,
//       date: entry.date,
//       billable_flag: entry.billable,
//       notes: entry.notes || undefined,
//     };

//     try {
//       await utilizationApi.createTimeEntry({ ...baseEntry, hours: entry.hours });
//     } catch (err) {
//       if (err instanceof OvertimeConfirmationError) {
//         const wantsOvertime = window.confirm(
//           `Only ${err.remainingNormalHours}h of normal time remain today. ` +
//             `Logging ${entry.hours}h would include overtime. Continue and log the overtime hours too?`
//         );
//         if (wantsOvertime) {
//           await utilizationApi.createTimeEntry({ ...baseEntry, hours: entry.hours, confirm_overtime: true });
//         } else if (err.remainingNormalHours > 0) {
//           // Log only what fits within today's remaining normal budget.
//           await utilizationApi.createTimeEntry({ ...baseEntry, hours: err.remainingNormalHours });
//         } else {
//           // No normal hours left today and overtime was declined - nothing to log.
//           window.alert("You've already used all 8 normal hours today. Nothing was logged.");
//           return;
//         }
//       } else {
//         throw err;
//       }
//     }
//     await loadDashboard(); // refresh summary + trend after logging
//   }

//   if (!currentEmployeeId || loading) {
//     return <div className="cu-page cu-page--status">Loading your utilization…</div>;
//   }

//   if (loadError) {
//     return <div className="cu-page cu-page--status cu-page--error">Couldn't load this page: {loadError}</div>;
//   }

//   if (!dashboard) {
//     return null;
//   }

//   const projectRows = (Object.entries(dashboard.hours_by_project) as [string, number][]).sort(
//     (a, b) => b[1] - a[1]
//   );
//   const trendRows = (Object.entries(dashboard.weekly_trend) as [string, number][]).sort((a, b) =>
//     a[0] > b[0] ? 1 : -1
//   );
//   const maxTrendHours = Math.max(1, ...trendRows.map(([, hours]) => hours));

//   return (
//     <div className="cu-page">
//       <h1 className="cu-page__title">Consultant Utilization</h1>
//       <p className="cu-page__subtitle">
//         Last 7 days · {periodStart} to {periodEnd}
//       </p>

//       <UtilizationSummaryCard summary={dashboard.summary} />

//       <div className="cu-page__grid">
//         <section className="cu-panel">
//           <h2 className="cu-panel__title">Hours by project</h2>
//           {projectRows.length === 0 ? (
//             <p className="cu-panel__empty">No hours logged in this period yet.</p>
//           ) : (
//             <table className="cu-table">
//               <thead>
//                 <tr>
//                   <th>Project</th>
//                   <th>Hours</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {projectRows.map(([projectId, hours]) => (
//                   <tr key={projectId}>
//                     <td>{projects.find((p: Project) => p.project_id === projectId)?.name ?? projectId}</td>
//                     <td>{hours.toFixed(1)}h</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </section>

//         <section className="cu-panel">
//           <h2 className="cu-panel__title">Weekly trend</h2>
//           {trendRows.length === 0 ? (
//             <p className="cu-panel__empty">Nothing to trend yet.</p>
//           ) : (
//             <div className="cu-trend">
//               {trendRows.map(([week, hours]) => (
//                 <div className="cu-trend__row" key={week}>
//                   <span className="cu-trend__label">{week}</span>
//                   <div className="cu-trend__bar-track">
//                     <div className="cu-trend__bar" style={{ width: `${(hours / maxTrendHours) * 100}%` }} />
//                   </div>
//                   <span className="cu-trend__value">{hours.toFixed(1)}h</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>

//       <TimeEntryForm projects={projects} onSubmit={handleLogHours} />

//       <section className="cu-panel cu-panel--entries">
//         <h2 className="cu-panel__title">Recent entries</h2>
//         {recentEntries.length === 0 ? (
//           <p className="cu-panel__empty">No entries logged in this period yet.</p>
//         ) : (
//           <table className="cu-table cu-table--entries">
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Project</th>
//                 <th>Hours</th>
//                 <th>Normal</th>
//                 <th>OT</th>
//                 <th>Billable</th>
//                 <th>Notes</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentEntries.map((entry) => (
//                 <tr key={entry.entry_id}>
//                   <td>{entry.date}</td>
//                   <td>{projects.find((p: Project) => p.project_id === entry.project_id)?.name ?? entry.project_id}</td>
//                   <td>{entry.hours.toFixed(1)}h</td>
//                   <td>{entry.normal_hours.toFixed(1)}h</td>
//                   <td className={entry.overtime_hours > 0 ? "cu-table__ot" : undefined}>
//                     {entry.overtime_hours > 0 ? `${entry.overtime_hours.toFixed(1)}h` : "—"}
//                   </td>
//                   <td>{entry.billable_flag ? "Yes" : "No"}</td>
//                   <td className="cu-table__notes" title={entry.notes ?? undefined}>
//                     {entry.notes ? (
//                       entry.notes.length > 30
//                         ? `${entry.notes.slice(0, 30)}...`
//                         : entry.notes
//                     ) : (
//                       <span className="cu-panel__empty-inline">—</span>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </section>
//     </div>
//   );
// }


import { useEffect, useRef, useState } from "react";
import { utilizationApi, OvertimeConfirmationError, type Project, type PersonalDashboard, type TimeEntry } from "./api";
import { useAuth } from "../../shared/auth/AuthContext";
import { UtilizationSummaryCard } from "./components/UtilizationSummaryCard";
import { TimeEntryForm } from "./components/TimeEntryForm";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import "./ConsultantUtilizationPage.css";

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function ConsultantUtilizationPage() {
  const { employee } = useAuth();
  const currentEmployeeId = employee?.employee_id ?? "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboard, setDashboard] = useState<PersonalDashboard | null>(null);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const periodStart = isoDateNDaysAgo(7);
  const periodEnd = isoDateNDaysAgo(0);

  const [dialog, setDialog] = useState<{ message: string; mode: "confirm" | "alert" } | null>(null);
  const dialogResolveRef = useRef<((value: boolean) => void) | null>(null);

  function askConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      dialogResolveRef.current = resolve;
      setDialog({ message, mode: "confirm" });
    });
  }

  function handleDialogChoice(choice: boolean) {
    dialogResolveRef.current?.(choice);
    dialogResolveRef.current = null;
    setDialog(null);
  }

  async function loadDashboard() {
    const [projectList, personalDashboard, entries] = await Promise.all([
      utilizationApi.listProjects(),
      utilizationApi.getPersonalDashboard(currentEmployeeId, periodStart, periodEnd),
      utilizationApi.listTimeEntries(currentEmployeeId, periodStart, periodEnd),
    ]);
    setProjects(projectList);
    setDashboard(personalDashboard);
    setRecentEntries([...entries].sort((a, b) => (a.date < b.date ? 1 : -1)));
  }

  useEffect(() => {
    if (!currentEmployeeId) return;
    setLoading(true);
    loadDashboard()
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load your dashboard."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployeeId]);

  async function handleLogHours(entry: { projectId: string; date: string; hours: number; billable: boolean; notes: string }) {
    const baseEntry = {
      entry_id: `TE-${currentEmployeeId}-${entry.projectId}-${entry.date}-${Date.now()}`,
      employee_id: currentEmployeeId,
      project_id: entry.projectId,
      date: entry.date,
      billable_flag: entry.billable,
      notes: entry.notes || undefined,
    };

    try {
      await utilizationApi.createTimeEntry({ ...baseEntry, hours: entry.hours });
    } catch (err) {
      if (err instanceof OvertimeConfirmationError) {
        const wantsOvertime = await askConfirm(
          "You've completed your regular 8 hours. Do you want to continue with overtime?"
        );
        if (wantsOvertime) {
          await utilizationApi.createTimeEntry({ ...baseEntry, hours: entry.hours, confirm_overtime: true });
        } else {
          // Declined - nothing is saved. They can adjust the hours field
          // themselves and submit again.
          return;
        }
      } else {
        throw err;
      }
    }
    await loadDashboard();
  }

  if (!currentEmployeeId || loading) {
    return <div className="cu-page cu-page--status">Loading your utilization…</div>;
  }

  if (loadError) {
    return <div className="cu-page cu-page--status cu-page--error">Couldn't load this page: {loadError}</div>;
  }

  if (!dashboard) {
    return null;
  }

  const projectRows = (Object.entries(dashboard.hours_by_project) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const trendRows = (Object.entries(dashboard.weekly_trend) as [string, number][]).sort((a, b) =>
    a[0] > b[0] ? 1 : -1
  );
  const maxTrendHours = Math.max(1, ...trendRows.map(([, hours]) => hours));

  return (
    <div className="cu-page">
      <ConfirmDialog
        open={!!dialog}
        title={dialog?.mode === "alert" ? "Notice" : "Overtime confirmation"}
        message={dialog?.message ?? ""}
        hideCancel={dialog?.mode === "alert"}
        confirmLabel={dialog?.mode === "alert" ? "OK" : "Yes, log overtime"}
        cancelLabel="No"
        onConfirm={() => handleDialogChoice(true)}
        onCancel={() => handleDialogChoice(false)}
      />
      <h1 className="cu-page__title">Consultant Utilization</h1>
      <p className="cu-page__subtitle">
        Last 7 days · {periodStart} to {periodEnd}
      </p>

      <UtilizationSummaryCard summary={dashboard.summary} />

      <div className="cu-page__grid">
        <section className="cu-panel">
          <h2 className="cu-panel__title">Hours by project</h2>
          {projectRows.length === 0 ? (
            <p className="cu-panel__empty">No hours logged in this period yet.</p>
          ) : (
            <table className="cu-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.map(([projectId, hours]) => (
                  <tr key={projectId}>
                    <td>{projects.find((p: Project) => p.project_id === projectId)?.name ?? projectId}</td>
                    <td>{hours.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="cu-panel">
          <h2 className="cu-panel__title">Weekly trend</h2>
          {trendRows.length === 0 ? (
            <p className="cu-panel__empty">Nothing to trend yet.</p>
          ) : (
            <div className="cu-trend">
              {trendRows.map(([week, hours]) => (
                <div className="cu-trend__row" key={week}>
                  <span className="cu-trend__label">{week}</span>
                  <div className="cu-trend__bar-track">
                    <div className="cu-trend__bar" style={{ width: `${(hours / maxTrendHours) * 100}%` }} />
                  </div>
                  <span className="cu-trend__value">{hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <TimeEntryForm projects={projects} onSubmit={handleLogHours} />

      <section className="cu-panel cu-panel--entries">
        <h2 className="cu-panel__title">Recent entries</h2>
        {recentEntries.length === 0 ? (
          <p className="cu-panel__empty">No entries logged in this period yet.</p>
        ) : (
          <table className="cu-table cu-table--entries">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Normal</th>
                <th>OT</th>
                <th>Billable</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((entry) => (
                <tr key={entry.entry_id}>
                  <td>{entry.date}</td>
                  <td>{projects.find((p: Project) => p.project_id === entry.project_id)?.name ?? entry.project_id}</td>
                  <td>{entry.hours.toFixed(1)}h</td>
                  <td>{entry.normal_hours.toFixed(1)}h</td>
                  <td className={entry.overtime_hours > 0 ? "cu-table__ot" : undefined}>
                    {entry.overtime_hours > 0 ? `${entry.overtime_hours.toFixed(1)}h` : "—"}
                  </td>
                  <td>{entry.billable_flag ? "Yes" : "No"}</td>
                  <td className="cu-table__notes" title={entry.notes ?? undefined}>
                    {entry.notes ? entry.notes : <span className="cu-panel__empty-inline">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}