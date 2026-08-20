// import { useEffect, useState } from "react";
// import type { FormEvent } from "react";

// import {
//   utilizationApi,
//   type OrgUtilizationDashboard,
//   type Project,
//   type TimeEntryEmployee,
// } from "./api";

// import { AddProjectForm } from "./components/AddProjectForm";
// import { AdminLogHoursForm } from "./components/AdminLogHoursForm";

// import "./OrgDashboardPage.css";
// import "../shared-theme.css";

// const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";

// /*
//  * Never use toISOString() for local dates - it converts to UTC first,
//  * which shifts the date backward for any timezone ahead of UTC
//  * (e.g. India, UTC+5:30). Always build the date string from local
//  * year/month/day components instead.
//  */
// function toLocalISODate(d: Date): string {
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// }

// function isoDateNDaysAgo(n: number): string {
//   const d = new Date();
//   d.setDate(d.getDate() - n);
//   return toLocalISODate(d);
// }

// /*
//  * Admin/Leadership-only Org Dashboard.
//  *
//  * Manager no longer has a dashboard here - Manager is routed to
//  * ManagerDashboardPage (components/ManagerOrgDashboard.tsx) from
//  * UtilizationModulePage.tsx instead. This page assumes Admin access;
//  * UtilizationModulePage only renders it for isAdmin, so no in-page
//  * role branching is needed.
//  */
// export function OrgDashboardPage() {
//   /* =========================================================
//      DATE / CAPACITY

//      "Last 7 days INCLUDING TODAY" - inclusive 7-day range means
//      going back 6 days, not 7 (7 would give an 8-day span).
//   ========================================================= */

//   const [periodStart, setPeriodStart] = useState(
//     () => isoDateNDaysAgo(6)
//   );

//   const [periodEnd, setPeriodEnd] = useState(
//     () => isoDateNDaysAgo(0)
//   );

//   const [capacityHoursPerWeek, setCapacityHoursPerWeek] =
//     useState("40");

//   /* =========================================================
//      EMPLOYEES
//   ========================================================= */

//   const [currentEmployee, setCurrentEmployee] =
//     useState<TimeEntryEmployee | null>(null);

//   const [allEmployees, setAllEmployees] =
//     useState<TimeEntryEmployee[]>([]);

//   /* =========================================================
//      DASHBOARD DATA
//   ========================================================= */

//   const [dashboard, setDashboard] =
//     useState<OrgUtilizationDashboard | null>(null);

//   const [projects, setProjects] =
//     useState<Project[]>([]);

//   /* =========================================================
//      EMPLOYEE SEARCH

//      Searches by Employee ID or name.
//   ========================================================= */

//   const [employeeSearch, setEmployeeSearch] =
//     useState("");

//   /* =========================================================
//      PAGE STATE
//   ========================================================= */

//   const [loading, setLoading] =
//     useState(true);

//   const [loadError, setLoadError] =
//     useState<string | null>(null);

//   const [otNotice, setOtNotice] =
//     useState<string | null>(null);

//   /* =========================================================
//      LOAD PAGE
//   ========================================================= */

//   async function load() {
//     setLoading(true);
//     setLoadError(null);

//     try {
//       const currentEmployeeId =
//         localStorage.getItem(EMPLOYEE_ID_STORAGE_KEY);

//       if (!currentEmployeeId) {
//         throw new Error("Logged-in employee ID was not found.");
//       }

//       /*
//        * Backend decides which employees the current user is
//        * allowed to see. For Admin/Leadership this is everyone.
//        */
//       const employeeList =
//         await utilizationApi.listTimeEntryEmployees();

//       const me = employeeList.find(
//         (employee) => employee.employee_id === currentEmployeeId
//       );

//       if (!me) {
//         throw new Error("Current employee was not found.");
//       }

//       setCurrentEmployee(me);

//       const accessTier = me.access_tier?.trim().toLowerCase();

//       if (accessTier !== "admin/leadership") {
//         throw new Error(
//           "This dashboard is limited to Admin/Leadership accounts."
//         );
//       }

//       const [dash, projectList] = await Promise.all([
//         utilizationApi.getOrgDashboard(
//           periodStart,
//           periodEnd,
//           Number(capacityHoursPerWeek) || 40
//         ),
//         utilizationApi.listProjects(),
//       ]);

//       setDashboard(dash);
//       setProjects(projectList);
//       setAllEmployees(employeeList);
//     } catch (err) {
//       setLoadError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't load the dashboard."
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* =========================================================
//      INITIAL LOAD
//   ========================================================= */

//   useEffect(() => {
//     load();
//     // Initial load only.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* =========================================================
//      APPLY FILTER
//   ========================================================= */

//   function handleApply(e: FormEvent) {
//     e.preventDefault();
//     load();
//   }

//   /* =========================================================
//      ADD PROJECT
//   ========================================================= */

//   async function handleAddProject(input: {
//     name: string;
//     projectType: string;
//     billingRate: number;
//     costRate: number;
//   }) {
//     await utilizationApi.createProject({
//       project_id: `P-${Date.now()}`,
//       name: input.name,
//       project_type: input.projectType,
//       billing_rate: input.billingRate,
//       cost_rate: input.costRate,
//     });

//     await load();
//   }

//   /* =========================================================
//      ADMIN LOG HOURS
//   ========================================================= */

//   async function handleAdminLogHours(input: {
//     employeeId: string;
//     projectId: string;
//     date: string;
//     hours: number;
//     billable: boolean;
//   }) {
//     setOtNotice(null);

//     try {
//       const saved = await utilizationApi.createTimeEntry({
//         entry_id: `TE-${input.employeeId}-${input.projectId}-${input.date}-${Date.now()}`,
//         employee_id: input.employeeId,
//         project_id: input.projectId,
//         date: input.date,
//         hours: input.hours,
//         billable_flag: input.billable,
//       });

//       if (saved.ot_status === "Pending") {
//         setOtNotice(
//           `This includes ${saved.overtime_hours}h of overtime for ${input.employeeId}, sent for approval.`
//         );
//       }

//       await load();
//     } catch (err) {
//       setLoadError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't log hours for this employee."
//       );
//     }
//   }

//   /* =========================================================
//      EMPLOYEE NAME LOOKUP
//   ========================================================= */

//   function employeeName(employeeId: string): string {
//     const employee = allEmployees.find(
//       (item) => item.employee_id === employeeId
//     );
//     return employee?.name ?? employeeId;
//   }

//   /* =========================================================
//      SEARCH
//   ========================================================= */

//   const normalizedSearch = employeeSearch.trim().toLowerCase();

//   const filteredUtilization =
//     dashboard?.utilization_by_employee.filter((summary) => {
//       if (!normalizedSearch) return true;

//       const employee = allEmployees.find(
//         (item) => item.employee_id === summary.employee_id
//       );

//       const id = employee?.employee_id ?? summary.employee_id;
//       const name = employee?.name ?? "";

//       return (
//         id.toLowerCase().includes(normalizedSearch) ||
//         name.toLowerCase().includes(normalizedSearch)
//       );
//     }) ?? [];

//   /* =========================================================
//      LOADING
//   ========================================================= */

//   if (loading && !currentEmployee) {
//     return (
//       <div className="od-page">
//         <p className="od-page__loading">Loading dashboard...</p>
//       </div>
//     );
//   }

//   /* =========================================================
//      ACCESS DENIED
//   ========================================================= */

//   const accessTier = currentEmployee?.access_tier?.trim().toLowerCase();
//   const isAdmin = accessTier === "admin/leadership";

//   if (!isAdmin) {
//     return (
//       <p className="od-page__error">
//         {loadError ?? "This dashboard is not available for your account."}
//       </p>
//     );
//   }

//   /* =========================================================
//      PAGE
//   ========================================================= */

//   return (
//     <div className="od-page">
//       <h1 className="od-page__title">Org Utilization Dashboard</h1>
//       <p className="od-page__subtitle">Admin/Leadership view</p>

//       {/* ADD PROJECT */}
//       <AddProjectForm onSubmit={handleAddProject} />

//       {/* ADMIN LOG HOURS */}
//       <AdminLogHoursForm
//         employees={allEmployees}
//         projects={projects.map((project) => ({
//           project_id: project.project_id,
//           project_name: project.name,
//         }))}
//         onSubmit={handleAdminLogHours}
//       />

//       {/* OT NOTICE */}
//       {otNotice && <p className="od-page__ot-notice">{otNotice}</p>}

//       {/* DATE / CAPACITY FILTER */}
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
//           {loading ? "Loading..." : "Apply"}
//         </button>
//       </form>

//       {/* ERROR */}
//       {loadError && (
//         <p className="od-page__error">
//           Couldn't load this page: {loadError}
//         </p>
//       )}

//       {/* DASHBOARD */}
//       {dashboard && (
//         <>
//           <p className="od-page__range">
//             Showing {dashboard.period_start} to {dashboard.period_end}
//           </p>

//           {/* FLAGS */}
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
//               <div className="od-flag__label">Over-allocated</div>
//               <div className="od-flag__ids">
//                 {dashboard.over_allocated.join(", ") || "—"}
//               </div>
//             </div>
//           </div>

//           {/* UTILIZATION */}
//           <section className="od-panel">
//             <h2 className="od-panel__title">Utilization by employee</h2>

//             <div className="od-employee-search">
//               <input
//                 type="text"
//                 value={employeeSearch}
//                 onChange={(e) => setEmployeeSearch(e.target.value)}
//                 placeholder="Search by employee name or ID..."
//                 aria-label="Search employees by name or ID"
//                 autoComplete="off"
//               />
//             </div>

//             {filteredUtilization.length === 0 ? (
//               <p className="od-panel__empty">
//                 {employeeSearch.trim()
//                   ? "No employees found matching your search."
//                   : "No time entries logged in this period yet."}
//               </p>
//             ) : (
//               <div className="od-table-wrapper">
//                 <table className="od-table">
//                   <thead>
//                     <tr>
//                       <th>ID</th>
//                       <th>Name</th>
//                       <th>Billable hours</th>
//                       <th>Available hours</th>
//                       <th>Utilization</th>
//                       <th>Flag</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredUtilization.map((u) => (
//                       <tr key={u.employee_id}>
//                         <td>{u.employee_id}</td>
//                         <td>{employeeName(u.employee_id)}</td>
//                         <td>{u.billable_hours.toFixed(1)}h</td>
//                         <td>{u.available_hours.toFixed(1)}h</td>
//                         <td>{Math.round(u.utilization_pct * 100)}%</td>
//                         <td>{u.flag ?? "on track"}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>

//           {/* PROJECT MARGINS */}
//           <section className="od-panel">
//             <h2 className="od-panel__title">Project margins</h2>

//             {dashboard.project_margins.length === 0 ? (
//               <p className="od-panel__empty">No projects yet.</p>
//             ) : (
//               <div className="od-table-wrapper">
//                 <table className="od-table">
//                   <thead>
//                     <tr>
//                       <th>Project</th>
//                       <th>Revenue</th>
//                       <th>Cost</th>
//                       <th>Margin</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {dashboard.project_margins.map((m) => (
//                       <tr key={m.project_id}>
//                         <td>{m.project_name}</td>
//                         <td>₹{m.revenue.toLocaleString()}</td>
//                         <td>₹{m.cost.toLocaleString()}</td>
//                         <td>₹{m.margin.toLocaleString()}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         </>
//       )}
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  utilizationApi,
  type OrgUtilizationDashboard,
  type Project,
  type TimeEntryEmployee,
} from "./api";

import { AddProjectForm } from "./components/AddProjectForm";
import { AdminLogHoursForm } from "./components/AdminLogHoursForm";

import "./OrgDashboardPage.css";
import "../shared-theme.css";

const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";

/* =========================================================
   DATE HELPERS
========================================================= */

function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);

  return toLocalISODate(d);
}

/* =========================================================
   TABLE FILTER TYPE
========================================================= */

type EmployeeTableFilter =
  | "all"
  | "bench-risk"
  | "over-allocated";

/* =========================================================
   ADMIN / LEADERSHIP ORG DASHBOARD
========================================================= */

export function OrgDashboardPage() {
  /* =========================================================
     DATE / CAPACITY
  ========================================================= */

  const [periodStart, setPeriodStart] = useState(
    () => isoDateNDaysAgo(6)
  );

  const [periodEnd, setPeriodEnd] = useState(
    () => isoDateNDaysAgo(0)
  );

  const [capacityHoursPerWeek, setCapacityHoursPerWeek] =
    useState("40");

  /* =========================================================
     EMPLOYEES
  ========================================================= */

  const [currentEmployee, setCurrentEmployee] =
    useState<TimeEntryEmployee | null>(null);

  const [allEmployees, setAllEmployees] =
    useState<TimeEntryEmployee[]>([]);

  /* =========================================================
     DASHBOARD DATA
  ========================================================= */

  const [dashboard, setDashboard] =
    useState<OrgUtilizationDashboard | null>(null);

  const [projects, setProjects] =
    useState<Project[]>([]);

  /* =========================================================
     EMPLOYEE SEARCH
  ========================================================= */

  const [employeeSearch, setEmployeeSearch] =
    useState("");

  /* =========================================================
     TABLE FILTER
  ========================================================= */

  const [employeeTableFilter, setEmployeeTableFilter] =
    useState<EmployeeTableFilter>("all");

  /* =========================================================
     TABLE REF
  ========================================================= */

  const employeeTableRef =
    useRef<HTMLDivElement>(null);

  /* =========================================================
     PAGE STATE
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [otNotice, setOtNotice] =
    useState<string | null>(null);

  /* =========================================================
     LOAD PAGE
  ========================================================= */

  async function load() {
    setLoading(true);
    setLoadError(null);

    try {
      const currentEmployeeId =
        localStorage.getItem(
          EMPLOYEE_ID_STORAGE_KEY
        );

      if (!currentEmployeeId) {
        throw new Error(
          "Logged-in employee ID was not found."
        );
      }

      /*
       * Backend decides which employees the current user
       * is allowed to see.
       *
       * For Admin/Leadership this should return everyone.
       */
      const employeeList =
        await utilizationApi.listTimeEntryEmployees();

      const me = employeeList.find(
        (employee) =>
          employee.employee_id === currentEmployeeId
      );

      if (!me) {
        throw new Error(
          "Current employee was not found."
        );
      }

      setCurrentEmployee(me);

      const accessTier =
        me.access_tier?.trim().toLowerCase();

      if (accessTier !== "admin/leadership") {
        throw new Error(
          "This dashboard is limited to Admin/Leadership accounts."
        );
      }

      const [dash, projectList] =
        await Promise.all([
          utilizationApi.getOrgDashboard(
            periodStart,
            periodEnd,
            Number(capacityHoursPerWeek) || 40
          ),

          utilizationApi.listProjects(),
        ]);

      setDashboard(dash);
      setProjects(projectList);
      setAllEmployees(employeeList);

    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Couldn't load the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    load();

    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     APPLY FILTER
  ========================================================= */

  function handleApply(e: FormEvent) {
    e.preventDefault();

    /*
     * Whenever date/capacity changes,
     * return table to ALL employees.
     */
    setEmployeeTableFilter("all");
    setEmployeeSearch("");

    load();
  }

  /* =========================================================
     ADD PROJECT
  ========================================================= */

  async function handleAddProject(input: {
    name: string;
    projectType: string;
    billingRate: number;
    costRate: number;
  }) {
    await utilizationApi.createProject({
      project_id: `P-${Date.now()}`,
      name: input.name,
      project_type: input.projectType,
      billing_rate: input.billingRate,
      cost_rate: input.costRate,
    });

    await load();
  }

  /* =========================================================
     ADMIN LOG HOURS
  ========================================================= */

  async function handleAdminLogHours(input: {
    employeeId: string;
    projectId: string;
    date: string;
    hours: number;
    billable: boolean;
  }) {
    setOtNotice(null);

    try {
      const saved =
        await utilizationApi.createTimeEntry({
          entry_id:
            `TE-${input.employeeId}-${input.projectId}-${input.date}-${Date.now()}`,
          employee_id: input.employeeId,
          project_id: input.projectId,
          date: input.date,
          hours: input.hours,
          billable_flag: input.billable,
        });

      if (saved.ot_status === "Pending") {
        setOtNotice(
          `This includes ${saved.overtime_hours}h of overtime for ${input.employeeId}, sent for approval.`
        );
      }

      await load();

    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Couldn't log hours for this employee."
      );
    }
  }

  /* =========================================================
     EMPLOYEE NAME LOOKUP
  ========================================================= */

  function employeeName(
    employeeId: string
  ): string {
    const employee = allEmployees.find(
      (item) =>
        item.employee_id === employeeId
    );

    return employee?.name ?? employeeId;
  }

  /* =========================================================
     FILTER EMPLOYEE TABLE
  ========================================================= */

  function showEmployeeCategory(
    filter: EmployeeTableFilter
  ) {
    setEmployeeTableFilter(filter);

    /*
     * Clear existing search when changing category.
     * This makes sure the user sees the complete category.
     */
    setEmployeeSearch("");

    /*
     * Scroll directly to employee table.
     */
    setTimeout(() => {
      employeeTableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  /* =========================================================
     SEARCH + CATEGORY FILTER
  ========================================================= */

  const normalizedSearch =
    employeeSearch.trim().toLowerCase();

  const filteredUtilization =
    dashboard?.utilization_by_employee.filter(
      (summary) => {

        /* -----------------------------------------------
           CATEGORY FILTER
        ----------------------------------------------- */

        if (
          employeeTableFilter ===
          "bench-risk"
        ) {
          if (
            !dashboard.bench_risk.includes(
              summary.employee_id
            )
          ) {
            return false;
          }
        }

        if (
          employeeTableFilter ===
          "over-allocated"
        ) {
          if (
            !dashboard.over_allocated.includes(
              summary.employee_id
            )
          ) {
            return false;
          }
        }

        /* -----------------------------------------------
           SEARCH FILTER
        ----------------------------------------------- */

        if (!normalizedSearch) {
          return true;
        }

        const employee =
          allEmployees.find(
            (item) =>
              item.employee_id ===
              summary.employee_id
          );

        const id =
          employee?.employee_id ??
          summary.employee_id;

        const name =
          employee?.name ?? "";

        return (
          id
            .toLowerCase()
            .includes(normalizedSearch) ||
          name
            .toLowerCase()
            .includes(normalizedSearch)
        );
      }
    ) ?? [];

  /* =========================================================
     ACTIVE FILTER LABEL
  ========================================================= */

  function getTableFilterLabel(): string {
    if (
      employeeTableFilter ===
      "bench-risk"
    ) {
      return "Bench-risk employees";
    }

    if (
      employeeTableFilter ===
      "over-allocated"
    ) {
      return "Over-allocated employees";
    }

    return "All employees";
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading && !currentEmployee) {
    return (
      <div className="od-page">
        <p className="od-page__loading">
          Loading dashboard...
        </p>
      </div>
    );
  }

  /* =========================================================
     ACCESS DENIED
  ========================================================= */

  const accessTier =
    currentEmployee?.access_tier
      ?.trim()
      .toLowerCase();

  const isAdmin =
    accessTier === "admin/leadership";

  if (!isAdmin) {
    return (
      <p className="od-page__error">
        {loadError ??
          "This dashboard is not available for your account."}
      </p>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="od-page">

      {/* =====================================================
          PAGE TITLE
      ===================================================== */}

      <h1 className="od-page__title">
        Org Utilization Dashboard
      </h1>

      <p className="od-page__subtitle">
        Admin/Leadership view
      </p>

      {/* =====================================================
          ADD PROJECT
      ===================================================== */}

      <AddProjectForm
        onSubmit={handleAddProject}
      />

      {/* =====================================================
          ADMIN LOG HOURS
      ===================================================== */}

      <AdminLogHoursForm
        employees={allEmployees}
        projects={projects.map(
          (project) => ({
            project_id:
              project.project_id,
            project_name:
              project.name,
          })
        )}
        onSubmit={
          handleAdminLogHours
        }
      />

      {/* =====================================================
          OT NOTICE
      ===================================================== */}

      {otNotice && (
        <p className="od-page__ot-notice">
          {otNotice}
        </p>
      )}

      {/* =====================================================
          DATE / CAPACITY FILTER
      ===================================================== */}

      <form
        className="od-filters"
        onSubmit={handleApply}
      >

        <label>
          Start date

          <input
            type="date"
            value={periodStart}
            onChange={(e) =>
              setPeriodStart(
                e.target.value
              )
            }
          />
        </label>

        <label>
          End date

          <input
            type="date"
            value={periodEnd}
            onChange={(e) =>
              setPeriodEnd(
                e.target.value
              )
            }
          />
        </label>

        <label>
          Capacity hrs/week

          <input
            type="number"
            min="1"
            value={
              capacityHoursPerWeek
            }
            onChange={(e) =>
              setCapacityHoursPerWeek(
                e.target.value
              )
            }
          />
        </label>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "Apply"}
        </button>

      </form>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {loadError && (
        <p className="od-page__error">
          Couldn't load this page:{" "}
          {loadError}
        </p>
      )}

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      {dashboard && (
        <>

          {/* =================================================
              DATE RANGE
          ================================================= */}

          <p className="od-page__range">
            Showing{" "}
            {dashboard.period_start}{" "}
            to{" "}
            {dashboard.period_end}
          </p>

          {/* =================================================
              FLAG CARDS
          ================================================= */}

          <div className="od-page__flags">

            {/* -----------------------------------------------
                BENCH RISK
            ----------------------------------------------- */}

            <div className="od-flag od-flag--warn">

              <div className="od-flag__count">
                {
                  dashboard
                    .bench_risk
                    .length
                }
              </div>

              <div className="od-flag__label">
                Bench-risk
                (under-utilized)
              </div>

              <button
                type="button"
                className="od-flag__link"
                onClick={() =>
                  showEmployeeCategory(
                    "bench-risk"
                  )
                }
              >
                View in table →
              </button>

            </div>

            {/* -----------------------------------------------
                OVER ALLOCATED
            ----------------------------------------------- */}

            <div className="od-flag od-flag--danger">

              <div className="od-flag__count">
                {
                  dashboard
                    .over_allocated
                    .length
                }
              </div>

              <div className="od-flag__label">
                Over-allocated
              </div>

              <button
                type="button"
                className="od-flag__link"
                onClick={() =>
                  showEmployeeCategory(
                    "over-allocated"
                  )
                }
              >
                View in table →
              </button>

            </div>

          </div>

          {/* =================================================
              UTILIZATION BY EMPLOYEE
          ================================================= */}

          <section
            className="od-panel"
            ref={employeeTableRef}
          >

            <div className="od-panel__header">

              <div>

                <h2 className="od-panel__title">
                  Utilization by employee
                </h2>

                {employeeTableFilter !==
                  "all" && (
                  <p className="od-table-filter-label">
                    Showing:{" "}
                    <strong>
                      {getTableFilterLabel()}
                    </strong>
                  </p>
                )}

              </div>

              {/* =================================================
                  SHOW ALL EMPLOYEES BUTTON
              ================================================= */}

              {employeeTableFilter !==
                "all" && (
                <button
                  type="button"
                  className="od-clear-filter"
                  onClick={() => {
                    setEmployeeTableFilter(
                      "all"
                    );

                    setEmployeeSearch("");

                    /*
                     * Keep the user at the table.
                     */
                    setTimeout(() => {
                      employeeTableRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 50);
                  }}
                >
                  Show all employees
                </button>
              )}

            </div>

            {/* =================================================
                SEARCH
            ================================================= */}

            <div className="od-employee-search">

              <input
                type="text"
                value={
                  employeeSearch
                }
                onChange={(e) =>
                  setEmployeeSearch(
                    e.target.value
                  )
                }
                placeholder="Search by employee name or ID..."
                aria-label="Search employees by name or ID"
                autoComplete="off"
              />

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            {filteredUtilization.length ===
            0 ? (

              <p className="od-panel__empty">

                {employeeSearch.trim()
                  ? "No employees found matching your search."
                  : employeeTableFilter !==
                    "all"
                  ? `No ${getTableFilterLabel().toLowerCase()} found.`
                  : "No time entries logged in this period yet."}

              </p>

            ) : (

              /*
               * IMPORTANT:
               * This wrapper is the scrollable area.
               * It prevents 300+ employees from making
               * the whole page extremely tall.
               */
              <div className="od-table-wrapper">

                <table className="od-table">

                  <thead>

                    <tr>

                      <th>
                        ID
                      </th>

                      <th>
                        Name
                      </th>

                      <th>
                        Billable hours
                      </th>

                      <th>
                        Available hours
                      </th>

                      <th>
                        Utilization
                      </th>

                      <th>
                        Flag
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredUtilization.map(
                      (u) => (

                        <tr
                          key={
                            u.employee_id
                          }
                        >

                          <td>
                            {
                              u.employee_id
                            }
                          </td>

                          <td>
                            {employeeName(
                              u.employee_id
                            )}
                          </td>

                          <td>
                            {u.billable_hours.toFixed(
                              1
                            )}
                            h
                          </td>

                          <td>
                            {u.available_hours.toFixed(
                              1
                            )}
                            h
                          </td>

                          <td>
                            {Math.round(
                              u.utilization_pct *
                                100
                            )}
                            %
                          </td>

                          <td>
                            {u.flag ??
                              "on track"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          {/* =================================================
              PROJECT MARGINS
          ================================================= */}

          <section className="od-panel">

            <h2 className="od-panel__title">
              Project margins
            </h2>

            {dashboard
              .project_margins
              .length === 0 ? (

              <p className="od-panel__empty">
                No projects yet.
              </p>

            ) : (

              <div className="od-table-wrapper">

                <table className="od-table">

                  <thead>

                    <tr>

                      <th>
                        Project
                      </th>

                      <th>
                        Revenue
                      </th>

                      <th>
                        Cost
                      </th>

                      <th>
                        Margin
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {dashboard
                      .project_margins
                      .map((m) => (

                        <tr
                          key={
                            m.project_id
                          }
                        >

                          <td>
                            {
                              m.project_name
                            }
                          </td>

                          <td>
                            ₹
                            {m.revenue.toLocaleString()}
                          </td>

                          <td>
                            ₹
                            {m.cost.toLocaleString()}
                          </td>

                          <td>
                            ₹
                            {m.margin.toLocaleString()}
                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </>

      )}

    </div>
  );
}