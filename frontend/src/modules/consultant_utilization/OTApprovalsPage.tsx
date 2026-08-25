import { useEffect, useState } from "react";
import {
  utilizationApi,
  type Project,
  type TimeEntry,
  type TimeEntryEmployee,
} from "./api";
import "./OTApprovalsPage.css";

export function OTApprovalsPage() {
  const [pending, setPending] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<TimeEntryEmployee[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadAll() {
    const [pendingList, projectList, employeeList] = await Promise.all([
      utilizationApi.listPendingOT(),
      utilizationApi.listProjects(),
      utilizationApi.listTimeEntryEmployees(),
    ]);

    setPending(pendingList);
    setProjects(projectList);
    setEmployees(employeeList);
  }

  useEffect(() => {
    setLoading(true);

    loadAll()
      .catch((err) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Couldn't load pending overtime."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function employeeName(employeeId: string): string {
    const employee = employees.find(
      (item) => item.employee_id === employeeId
    );
    return employee?.name ?? "—";
  }

  async function handleApprove(entryId: string) {
    setActionError(null);

    try {
      await utilizationApi.approveOT(entryId);
      await loadAll();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Couldn't approve this overtime."
      );
    }
  }

  async function handleReject(entryId: string) {
    setActionError(null);

    try {
      await utilizationApi.rejectOT(entryId);
      await loadAll();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Couldn't reject this overtime."
      );
    }
  }

  if (loading) {
    return (
      <div className="ota-page ota-page--status">
        Loading pending overtime…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="ota-page ota-page--status ota-page--error">
        Couldn't load this page: {loadError}
      </div>
    );
  }

  return (
    <div className="ota-page">
      <h1 className="ota-page__title">
        Overtime Approvals
      </h1>

      <p className="ota-page__subtitle">
        Overtime saves immediately when logged, but only counts
        toward utilization once approved by the employee's
        direct manager.
      </p>

      {actionError && (
        <p className="ota-page__error">
          {actionError}
        </p>
      )}

      {pending.length === 0 ? (
        <p className="ota-page__empty">
          No pending overtime from your direct reports right now.
        </p>
      ) : (
        <div className="ota-table-wrap">
          <table className="ota-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Project</th>
                <th>Date</th>
                <th>Normal</th>
                <th>Overtime</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {pending.map((entry) => (
                <tr key={entry.entry_id}>
                  <td>
                    {entry.employee_id}
                  </td>

                  <td>
                    {employeeName(entry.employee_id)}
                  </td>

                  <td>
                    {
                      projects.find(
                        (p) =>
                          p.project_id === entry.project_id
                      )?.name ?? entry.project_id
                    }
                  </td>

                  <td>
                    {entry.date}
                  </td>

                  <td>
                    {entry.normal_hours.toFixed(1)}h
                  </td>

                  <td className="ota-table__ot">
                    {entry.overtime_hours.toFixed(1)}h
                  </td>

                  <td
                    className="ota-table__notes"
                    title={entry.notes ?? undefined}
                  >
                    {entry.notes || "—"}
                  </td>

                  <td className="ota-table__actions">
                    <button
                      type="button"
                      className="ota-btn ota-btn--approve"
                      onClick={() =>
                        handleApprove(entry.entry_id)
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      className="ota-btn ota-btn--reject"
                      onClick={() =>
                        handleReject(entry.entry_id)
                      }
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// import { useEffect, useState } from "react";
// import {
//   utilizationApi,
//   type Project,
//   type TimeEntry,
// } from "./api";
// import "./OTApprovalsPage.css";

// /* =========================================================
//    TYPES
// ========================================================= */

// type Employee = {
//   employee_id: string;
//   name: string;
//   designation?: string | null;
//   manager_id?: string | null;
//   access_tier?: string;
// };

// /* =========================================================
//    COMPONENT
// ========================================================= */

// export function OTApprovalsPage() {
//   const [pending, setPending] = useState<TimeEntry[]>([]);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [employees, setEmployees] = useState<Employee[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState<string | null>(null);
//   const [actionError, setActionError] = useState<string | null>(null);

//   /* =========================================================
//      LOAD DATA
//   ========================================================= */

//   async function loadAll() {
//     /*
//      * Load pending overtime and projects.
//      */
//     const [pendingList, projectList] = await Promise.all([
//       utilizationApi.listPendingOT(),
//       utilizationApi.listProjects(),
//     ]);

//     setPending(pendingList);
//     setProjects(projectList);

//     /*
//      * Load employees.
//      *
//      * Swagger confirmed this endpoint works:
//      *
//      * GET /utilization/time-entry-employees
//      *
//      * The backend expects X-Employee-Id.
//      */
//     const employeeResponse = await fetch(
//       "http://127.0.0.1:8000/utilization/time-entry-employees",
//       {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//           "X-Employee-Id": "Admin1",
//         },
//       }
//     );

//     if (!employeeResponse.ok) {
//       throw new Error(
//         "Couldn't load employee names."
//       );
//     }

//     const employeeList: Employee[] =
//       await employeeResponse.json();

//     setEmployees(employeeList);
//   }

//   /* =========================================================
//      INITIAL LOAD
//   ========================================================= */

//   useEffect(() => {
//     let cancelled = false;

//     setLoading(true);
//     setLoadError(null);

//     loadAll()
//       .catch((err) => {
//         if (cancelled) return;

//         setLoadError(
//           err instanceof Error
//             ? err.message
//             : "Couldn't load pending overtime."
//         );
//       })
//       .finally(() => {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   /* =========================================================
//      APPROVE OT
//   ========================================================= */

//   async function handleApprove(entryId: string) {
//     setActionError(null);

//     try {
//       await utilizationApi.approveOT(entryId);

//       await loadAll();
//     } catch (err) {
//       setActionError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't approve this overtime."
//       );
//     }
//   }

//   /* =========================================================
//      REJECT OT
//   ========================================================= */

//   async function handleReject(entryId: string) {
//     setActionError(null);

//     try {
//       await utilizationApi.rejectOT(entryId);

//       await loadAll();
//     } catch (err) {
//       setActionError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't reject this overtime."
//       );
//     }
//   }

//   /* =========================================================
//      GET EMPLOYEE NAME
//   ========================================================= */

//   function getEmployeeName(
//     employeeId: string
//   ): string {
//     const employee = employees.find(
//       (item) =>
//         item.employee_id === employeeId
//     );

//     return employee?.name ?? "—";
//   }

//   /* =========================================================
//      GET PROJECT NAME
//   ========================================================= */

//   function getProjectName(
//     projectId: string
//   ): string {
//     const project = projects.find(
//       (item) =>
//         item.project_id === projectId
//     );

//     return project?.name ?? projectId;
//   }

//   /* =========================================================
//      LOADING
//   ========================================================= */

//   if (loading) {
//     return (
//       <div className="ota-page ota-page--status">
//         Loading pending overtime…
//       </div>
//     );
//   }

//   /* =========================================================
//      ERROR
//   ========================================================= */

//   if (loadError) {
//     return (
//       <div className="ota-page ota-page--status ota-page--error">
//         Couldn't load this page: {loadError}
//       </div>
//     );
//   }

//   /* =========================================================
//      PAGE
//   ========================================================= */

//   return (
//     <div className="ota-page">

//       {/* =====================================================
//           TITLE
//       ===================================================== */}

//       <h1 className="ota-page__title">
//         Overtime Approvals
//       </h1>

//       <p className="ota-page__subtitle">
//         Overtime saves immediately when logged, but only counts
//         toward utilization once approved by the employee's
//         direct manager.
//       </p>

//       {/* =====================================================
//           ACTION ERROR
//       ===================================================== */}

//       {actionError && (
//         <p className="ota-page__error">
//           {actionError}
//         </p>
//       )}

//       {/* =====================================================
//           NO PENDING OT
//       ===================================================== */}

//       {pending.length === 0 ? (
//         <p className="ota-page__empty">
//           No pending overtime from your direct reports right now.
//         </p>
//       ) : (
//         <div className="ota-table-wrap">

//           <table className="ota-table">

//             {/* =================================================
//                 HEADER
//             ================================================= */}

//             <thead>
//               <tr>
//                 <th>Employee ID</th>
//                 <th>Name</th>
//                 <th>Project</th>
//                 <th>Date</th>
//                 <th>Normal</th>
//                 <th>Overtime</th>
//                 <th>Notes</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             {/* =================================================
//                 BODY
//             ================================================= */}

//             <tbody>

//               {pending.map((entry) => (
//                 <tr key={entry.entry_id}>

//                   {/* EMPLOYEE ID */}

//                   <td className="ota-table__employee-id">
//                     {entry.employee_id}
//                   </td>

//                   {/* EMPLOYEE NAME */}

//                   <td className="ota-table__employee-name">
//                     {getEmployeeName(
//                       entry.employee_id
//                     )}
//                   </td>

//                   {/* PROJECT */}

//                   <td>
//                     {getProjectName(
//                       entry.project_id
//                     )}
//                   </td>

//                   {/* DATE */}

//                   <td>
//                     {entry.date}
//                   </td>

//                   {/* NORMAL HOURS */}

//                   <td>
//                     {entry.normal_hours.toFixed(1)}h
//                   </td>

//                   {/* OVERTIME HOURS */}

//                   <td className="ota-table__ot">
//                     {entry.overtime_hours.toFixed(1)}h
//                   </td>

//                   {/* NOTES */}

//                   <td
//                     className="ota-table__notes"
//                     title={
//                       entry.notes ?? undefined
//                     }
//                   >
//                     {entry.notes || "—"}
//                   </td>

//                   {/* ACTIONS */}

//                   <td className="ota-table__actions">

//                     <button
//                       type="button"
//                       className="ota-btn ota-btn--approve"
//                       onClick={() =>
//                         handleApprove(
//                           entry.entry_id
//                         )
//                       }
//                     >
//                       Approve
//                     </button>

//                     <button
//                       type="button"
//                       className="ota-btn ota-btn--reject"
//                       onClick={() =>
//                         handleReject(
//                           entry.entry_id
//                         )
//                       }
//                     >
//                       Reject
//                     </button>

//                   </td>

//                 </tr>
//               ))}

//             </tbody>

//           </table>

//         </div>
//       )}

//     </div>
//   );
// }

// export default OTApprovalsPage;