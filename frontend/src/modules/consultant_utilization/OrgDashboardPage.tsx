// import { useEffect, useState } from "react";
// import { utilizationApi, type OrgUtilizationDashboard, type Project } from "./api";
// import { AddProjectForm } from "./components/AddProjectForm";
// import { AdminLogHoursForm } from "./components/AdminLogHoursForm";
// import "./OrgDashboardPage.css";
// import "../shared-theme.css";

// function isoDateNDaysAgo(n: number): string {
//   const d = new Date();
//   d.setDate(d.getDate() - n);
//   return d.toISOString().slice(0, 10);
// }

// export function OrgDashboardPage() {
//   const [periodStart, setPeriodStart] = useState(() => isoDateNDaysAgo(7));
//   const [periodEnd, setPeriodEnd] = useState(() => isoDateNDaysAgo(0));
//   const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState("40");

//   const [dashboard, setDashboard] = useState<OrgUtilizationDashboard | null>(null);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState<string | null>(null);

//   function load(start: string, end: string, capacity: number) {
//     setLoading(true);
//     setLoadError(null);

//     Promise.all([
//       utilizationApi.getOrgDashboard(start, end, capacity),
//       utilizationApi.listProjects(),
//     ])
//       .then(([dash, projectList]) => {
//         setDashboard(dash);
//         setProjects(projectList);
//       })
//       .catch((err) =>
//         setLoadError(err instanceof Error ? err.message : "Couldn't load the org dashboard.")
//       )
//       .finally(() => setLoading(false));
//   }

//   useEffect(() => {
//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   function handleApply(e: React.FormEvent) {
//     e.preventDefault();
//     if (!periodStart || !periodEnd) return;
//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
//   }

//   async function handleAddProject(input: {
//     name: string;
//     projectType: string;
//     billingRate: number | null;
//     costRate: number | null;
//   }) {
//     await utilizationApi.createProject({
//       project_id: `P-${Date.now()}`,
//       name: input.name,
//       project_type: input.projectType,
//       billing_rate: input.billingRate,
//       cost_rate: input.costRate,
//     });

//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
//   }

//   async function handleAdminLogHours(input: {
//     employeeId: string;
//     projectId: string;
//     date: string;
//     hours: number;
//     billable: boolean;
//   }) {
//     await utilizationApi.createTimeEntry({
//       entry_id: `TE-${input.employeeId}-${input.projectId}-${input.date}-${Date.now()}`,
//       employee_id: input.employeeId,
//       project_id: input.projectId,
//       date: input.date,
//       hours: input.hours,
//       billable_flag: input.billable,
//     });

//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
//   }

//   return (
//     <div className="od-page">
//       <h1 className="od-page__title">Org Utilization Dashboard</h1>
//       <p className="od-page__subtitle">Admin/Leadership view</p>

//       <AddProjectForm onSubmit={handleAddProject} />

//       <AdminLogHoursForm
//         projects={projects}
//         onSubmit={handleAdminLogHours}
//       />

//       <form className="od-filters" onSubmit={handleApply}>
//         <label>
//           Start date
//           <input
//             type="date"
//             value={periodStart}
//             onChange={(e) => setPeriodStart(e.target.value)}
//           />
//         </label>

//         <label>
//           End date
//           <input
//             type="date"
//             value={periodEnd}
//             onChange={(e) => setPeriodEnd(e.target.value)}
//           />
//         </label>

//         <label>
//           Capacity hrs/week
//           <input
//             type="number"
//             min="1"
//             value={capacityHoursPerWeek}
//             onChange={(e) => setCapacityHoursPerWeek(e.target.value)}
//           />
//         </label>

//         <button type="submit" disabled={loading}>
//           {loading ? "Loading…" : "Apply"}
//         </button>
//       </form>

//       {loadError && (
//         <p className="od-page__error">
//           Couldn't load this page: {loadError}
//         </p>
//       )}

//       {loading && !dashboard && (
//         <p className="od-page__loading">Loading org dashboard…</p>
//       )}

//       {dashboard && (
//         <>
//           <p className="od-page__range">
//             Showing {dashboard.period_start} to {dashboard.period_end}
//           </p>

//           <div className="od-page__flags">
//             <div className="od-flag od-flag--warn">
//               <div className="od-flag__count">
//                 {dashboard.bench_risk.length}
//               </div>
//               <div className="od-flag__label">
//                 Bench-risk (under-utilized)
//               </div>
//               <div className="od-flag__ids">
//                 {dashboard.bench_risk.join(", ") || "—"}
//               </div>
//             </div>

//             <div className="od-flag od-flag--danger">
//               <div className="od-flag__count">
//                 {dashboard.over_allocated.length}
//               </div>
//               <div className="od-flag__label">
//                 Over-allocated
//               </div>
//               <div className="od-flag__ids">
//                 {dashboard.over_allocated.join(", ") || "—"}
//               </div>
//             </div>
//           </div>

//           <section className="od-panel">
//             <h2 className="od-panel__title">
//               Utilization by employee
//             </h2>

//             {dashboard.utilization_by_employee.length === 0 ? (
//               <p className="od-panel__empty">
//                 No time entries logged in this period yet.
//               </p>
//             ) : (
//               <table className="od-table">
//                 <thead>
//                   <tr>
//                     <th>Employee</th>
//                     <th>Billable hours</th>
//                     <th>Available hours</th>
//                     <th>Utilization</th>
//                     <th>Flag</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {dashboard.utilization_by_employee.map((u) => (
//                     <tr key={u.employee_id}>
//                       <td>{u.employee_id}</td>
//                       <td>{u.billable_hours.toFixed(1)}h</td>
//                       <td>{u.available_hours.toFixed(1)}h</td>
//                       <td>{Math.round(u.utilization_pct * 100)}%</td>
//                       <td>{u.flag ?? "on track"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </section>

//           <section className="od-panel">
//             <h2 className="od-panel__title">Project margins</h2>

//             {dashboard.project_margins.length === 0 ? (
//               <p className="od-panel__empty">No projects yet.</p>
//             ) : (
//               <table className="od-table">
//                 <thead>
//                   <tr>
//                     <th>Project</th>
//                     <th>Revenue</th>
//                     <th>Cost</th>
//                     <th>Margin</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {dashboard.project_margins.map((m) => (
//                     <tr key={m.project_id}>
//                       <td>{m.project_name}</td>

//                       <td>₹{m.revenue.toLocaleString()}</td>

//                       <td>₹{m.cost.toLocaleString()}</td>

//                       <td className={m.margin < 0 ? "od-table__negative" : ""}>
//                         {m.margin > 0
//                           ? `+₹${m.margin.toLocaleString()}`
//                           : `₹${m.margin.toLocaleString()}`}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </section>
//         </>
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { utilizationApi, OvertimeConfirmationError, type OrgUtilizationDashboard, type Project } from "./api";
// import { AddProjectForm } from "./components/AddProjectForm";
// import { AdminLogHoursForm } from "./components/AdminLogHoursForm";
// import "./OrgDashboardPage.css";
// import "../shared-theme.css";

// function isoDateNDaysAgo(n: number): string {
//   const d = new Date();
//   d.setDate(d.getDate() - n);
//   return d.toISOString().slice(0, 10);
// }

// export function OrgDashboardPage() {
//   const [periodStart, setPeriodStart] = useState(() => isoDateNDaysAgo(7));
//   const [periodEnd, setPeriodEnd] = useState(() => isoDateNDaysAgo(0));
//   const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState("40");

//   const [dashboard, setDashboard] = useState<OrgUtilizationDashboard | null>(null);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState<string | null>(null);

//   function load(start: string, end: string, capacity: number) {
//     setLoading(true);
//     setLoadError(null);
//     Promise.all([
//       utilizationApi.getOrgDashboard(start, end, capacity),
//       utilizationApi.listProjects(),
//     ])
//       .then(([dash, projectList]) => {
//         setDashboard(dash);
//         setProjects(projectList);
//       })
//       .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load the org dashboard."))
//       .finally(() => setLoading(false));
//   }

//   // Initial load with the default "last 7 days" window.
//   useEffect(() => {
//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   function handleApply(e: React.FormEvent) {
//     e.preventDefault();
//     if (!periodStart || !periodEnd) return;
//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
//   }

//   async function handleAddProject(input: {
//     name: string;
//     projectType: string;
//     billingRate: number | null;
//     costRate: number | null;
//   }) {
//     await utilizationApi.createProject({
//       project_id: `P-${Date.now()}`,
//       name: input.name,
//       project_type: input.projectType,
//       billing_rate: input.billingRate,
//       cost_rate: input.costRate,
//     });
//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40); // refresh so new project shows in margins table
//   }

//   async function handleAdminLogHours(input: {
//     employeeId: string;
//     projectId: string;
//     date: string;
//     hours: number;
//     billable: boolean;
//     notes?: string;
//   }) {
//     const baseEntry = {
//       entry_id: `TE-${input.employeeId}-${input.projectId}-${input.date}-${Date.now()}`,
//       employee_id: input.employeeId,
//       project_id: input.projectId,
//       date: input.date,
//       billable_flag: input.billable,
//       notes: input.notes || undefined,
//     };

//     try {
//       await utilizationApi.createTimeEntry({ ...baseEntry, hours: input.hours });
//     } catch (err) {
//       if (err instanceof OvertimeConfirmationError) {
//         const wantsOvertime = window.confirm(
//           `${input.employeeId} has only ${err.remainingNormalHours}h of normal time remaining that day. ` +
//             `Logging ${input.hours}h would include overtime. Continue and log the overtime hours too?`
//         );
//         if (wantsOvertime) {
//           await utilizationApi.createTimeEntry({ ...baseEntry, hours: input.hours, confirm_overtime: true });
//         } else if (err.remainingNormalHours > 0) {
//           await utilizationApi.createTimeEntry({ ...baseEntry, hours: err.remainingNormalHours });
//         } else {
//           window.alert(`${input.employeeId} already has 8 normal hours logged that day. Nothing was logged.`);
//           return;
//         }
//       } else {
//         throw err;
//       }
//     }
//     load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40); // refresh so the entry shows in utilization-by-employee
//   }

//   return (
//     <div className="od-page">
//       <h1 className="od-page__title">Org Utilization Dashboard</h1>
//       <p className="od-page__subtitle">Admin/Leadership view</p>

//       <AddProjectForm onSubmit={handleAddProject} />

//       <AdminLogHoursForm projects={projects} onSubmit={handleAdminLogHours} />

//       <form className="od-filters" onSubmit={handleApply}>
//         <label>
//           Start date
//           <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
//         </label>
//         <label>
//           End date
//           <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
//         </label>
//         <label>
//           Capacity hrs/week
//           <input
//             type="number"
//             min="1"
//             value={capacityHoursPerWeek}
//             onChange={(e) => setCapacityHoursPerWeek(e.target.value)}
//           />
//         </label>
//         <button type="submit" disabled={loading}>
//           {loading ? "Loading…" : "Apply"}
//         </button>
//       </form>

//       {loadError && <p className="od-page__error">Couldn't load this page: {loadError}</p>}

//       {loading && !dashboard && <p className="od-page__loading">Loading org dashboard…</p>}

//       {dashboard && (
//         <>
//           <p className="od-page__range">
//             Showing {dashboard.period_start} to {dashboard.period_end}
//           </p>

//           <div className="od-page__flags">
//             <div className="od-flag od-flag--warn">
//               <div className="od-flag__count">{dashboard.bench_risk.length}</div>
//               <div className="od-flag__label">Bench-risk (under-utilized)</div>
//               <div className="od-flag__ids">{dashboard.bench_risk.join(", ") || "—"}</div>
//             </div>
//             <div className="od-flag od-flag--danger">
//               <div className="od-flag__count">{dashboard.over_allocated.length}</div>
//               <div className="od-flag__label">Over-allocated</div>
//               <div className="od-flag__ids">{dashboard.over_allocated.join(", ") || "—"}</div>
//             </div>
//           </div>

//           <section className="od-panel">
//             <h2 className="od-panel__title">Utilization by employee</h2>
//             {dashboard.utilization_by_employee.length === 0 ? (
//               <p className="od-panel__empty">No time entries logged in this period yet.</p>
//             ) : (
//               <table className="od-table">
//                 <thead>
//                   <tr>
//                     <th>Employee</th>
//                     <th>Billable hours</th>
//                     <th>Available hours</th>
//                     <th>Utilization</th>
//                     <th>Flag</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {dashboard.utilization_by_employee.map((u) => (
//                     <tr key={u.employee_id}>
//                       <td>{u.employee_id}</td>
//                       <td>{u.billable_hours.toFixed(1)}h</td>
//                       <td>{u.available_hours.toFixed(1)}h</td>
//                       <td>{Math.round(u.utilization_pct * 100)}%</td>
//                       <td>{u.flag ?? "on track"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </section>

//           <section className="od-panel">
//             <h2 className="od-panel__title">Project margins</h2>
//             {dashboard.project_margins.length === 0 ? (
//               <p className="od-panel__empty">No projects yet.</p>
//             ) : (
//               <table className="od-table">
//                 <thead>
//                   <tr>
//                     <th>Project</th>
//                     <th>Revenue</th>
//                     <th>Cost</th>
//                     <th>Margin</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {dashboard.project_margins.map((m) => (
//                     <tr key={m.project_id}>
//                       <td>{m.project_name}</td>
//                       <td>₹{m.revenue.toLocaleString()}</td>
//                       <td>₹{m.cost.toLocaleString()}</td>
//                       <td>₹{m.margin.toLocaleString()}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </section>
//         </>
//       )}
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { utilizationApi, OvertimeConfirmationError, type OrgUtilizationDashboard, type Project } from "./api";
import { AddProjectForm } from "./components/AddProjectForm";
import { AdminLogHoursForm } from "./components/AdminLogHoursForm";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import "./OrgDashboardPage.css";
import "../shared-theme.css";

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function OrgDashboardPage() {
  const [periodStart, setPeriodStart] = useState(() => isoDateNDaysAgo(7));
  const [periodEnd, setPeriodEnd] = useState(() => isoDateNDaysAgo(0));
  const [capacityHoursPerWeek, setCapacityHoursPerWeek] = useState("40");

  const [dashboard, setDashboard] = useState<OrgUtilizationDashboard | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  function load(start: string, end: string, capacity: number) {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      utilizationApi.getOrgDashboard(start, end, capacity),
      utilizationApi.listProjects(),
    ])
      .then(([dash, projectList]) => {
        setDashboard(dash);
        setProjects(projectList);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load the org dashboard."))
      .finally(() => setLoading(false));
  }

  // Initial load with the default "last 7 days" window.
  useEffect(() => {
    load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!periodStart || !periodEnd) return;
    load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40);
  }

  async function handleAddProject(input: {
    name: string;
    projectType: string;
    billingRate: number | null;
    costRate: number | null;
  }) {
    await utilizationApi.createProject({
      project_id: `P-${Date.now()}`,
      name: input.name,
      project_type: input.projectType,
      billing_rate: input.billingRate,
      cost_rate: input.costRate,
    });
    load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40); // refresh so new project shows in margins table
  }

  async function handleAdminLogHours(input: {
    employeeId: string;
    projectId: string;
    date: string;
    hours: number;
    billable: boolean;
    notes?: string;
  }) {
    const baseEntry = {
      entry_id: `TE-${input.employeeId}-${input.projectId}-${input.date}-${Date.now()}`,
      employee_id: input.employeeId,
      project_id: input.projectId,
      date: input.date,
      billable_flag: input.billable,
      notes: input.notes || undefined,
    };

    try {
      await utilizationApi.createTimeEntry({ ...baseEntry, hours: input.hours });
    } catch (err) {
      if (err instanceof OvertimeConfirmationError) {
        const wantsOvertime = await askConfirm(
          `${input.employeeId} has only ${err.remainingNormalHours}h of normal time remaining that day. ` +
            `Logging ${input.hours}h would include overtime. Continue and log the overtime hours too?`
        );
        if (wantsOvertime) {
          await utilizationApi.createTimeEntry({ ...baseEntry, hours: input.hours, confirm_overtime: true });
        } else {
          // Declined - nothing is saved. Admin can adjust the hours field
          // themselves and submit again.
          return;
        }
      } else {
        throw err;
      }
    }
    load(periodStart, periodEnd, Number(capacityHoursPerWeek) || 40); // refresh so the entry shows in utilization-by-employee
  }

  return (
    <div className="od-page">
      <h1 className="od-page__title">Org Utilization Dashboard</h1>
      <p className="od-page__subtitle">Admin/Leadership view</p>

      <AddProjectForm onSubmit={handleAddProject} />

      <AdminLogHoursForm projects={projects} onSubmit={handleAdminLogHours} />

      <form className="od-filters" onSubmit={handleApply}>
        <label>
          Start date
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </label>
        <label>
          End date
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </label>
        <label>
          Capacity hrs/week
          <input
            type="number"
            min="1"
            value={capacityHoursPerWeek}
            onChange={(e) => setCapacityHoursPerWeek(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Loading…" : "Apply"}
        </button>
      </form>

      {loadError && <p className="od-page__error">Couldn't load this page: {loadError}</p>}

      {loading && !dashboard && <p className="od-page__loading">Loading org dashboard…</p>}

      {dashboard && (
        <>
          <p className="od-page__range">
            Showing {dashboard.period_start} to {dashboard.period_end}
          </p>

          <div className="od-page__flags">
            <div className="od-flag od-flag--warn">
              <div className="od-flag__count">{dashboard.bench_risk.length}</div>
              <div className="od-flag__label">Bench-risk (under-utilized)</div>
              <div className="od-flag__ids">{dashboard.bench_risk.join(", ") || "—"}</div>
            </div>
            <div className="od-flag od-flag--danger">
              <div className="od-flag__count">{dashboard.over_allocated.length}</div>
              <div className="od-flag__label">Over-allocated</div>
              <div className="od-flag__ids">{dashboard.over_allocated.join(", ") || "—"}</div>
            </div>
          </div>

          <section className="od-panel">
            <h2 className="od-panel__title">Utilization by employee</h2>
            {dashboard.utilization_by_employee.length === 0 ? (
              <p className="od-panel__empty">No time entries logged in this period yet.</p>
            ) : (
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Billable hours</th>
                    <th>Available hours</th>
                    <th>Utilization</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.utilization_by_employee.map((u) => (
                    <tr key={u.employee_id}>
                      <td>{u.employee_id}</td>
                      <td>{u.billable_hours.toFixed(1)}h</td>
                      <td>{u.available_hours.toFixed(1)}h</td>
                      <td>{Math.round(u.utilization_pct * 100)}%</td>
                      <td>{u.flag ?? "on track"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="od-panel">
            <h2 className="od-panel__title">Project margins</h2>
            {dashboard.project_margins.length === 0 ? (
              <p className="od-panel__empty">No projects yet.</p>
            ) : (
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.project_margins.map((m) => (
                    <tr key={m.project_id}>
                      <td>{m.project_name}</td>
                      <td>₹{m.revenue.toLocaleString()}</td>
                      <td>₹{m.cost.toLocaleString()}</td>
                      <td>₹{m.margin.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}