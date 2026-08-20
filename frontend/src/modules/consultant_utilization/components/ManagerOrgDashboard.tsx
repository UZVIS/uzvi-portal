// import { useEffect, useState, type FormEvent } from "react";

// import {
//   utilizationApi,
//   type TimeEntryEmployee,
//   type UtilizationSummary,
// } from "../api";

// import "./ManagerOrgDashboard.css";


// /* =========================================================
//    STORAGE
// ========================================================= */

// const EMPLOYEE_ID_STORAGE_KEY = "uzvi_portal_employee_id";


// /* =========================================================
//    DATE HELPERS

//    Never use toISOString() for local dates - it converts to
//    UTC first, which shifts the date backward for any timezone
//    ahead of UTC (e.g. India, UTC+5:30). Always build the date
//    string from local year/month/day components instead.
// ========================================================= */

// function toLocalISODate(d: Date): string {
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// }

// function today(): string {
//   return toLocalISODate(new Date());
// }

// function daysAgo(days: number): string {
//   const d = new Date();
//   d.setDate(d.getDate() - days);
//   return toLocalISODate(d);
// }


// /* =========================================================
//    PAGE
// ========================================================= */

// export function ManagerDashboardPage() {

//   /* -------------------------------------------------------
//      EMPLOYEES
//   ------------------------------------------------------- */

//   const [employees, setEmployees] = useState
//     TimeEntryEmployee[]
//   >([]);


//   /* -------------------------------------------------------
//      UTILIZATION
//   ------------------------------------------------------- */

//   const [utilization, setUtilization] = useState
//     UtilizationSummary[]
//   >([]);


//   /* -------------------------------------------------------
//      DATES

//      "Last 7 days INCLUDING TODAY" is an inclusive 7-day
//      range, so start = 6 days ago, not 7 (7 gives an 8-day
//      span: e.g. Aug 12-19 instead of Aug 13-19).
//   ------------------------------------------------------- */

//   const [startDate, setStartDate] = useState(
//     () => daysAgo(6)
//   );

//   const [endDate, setEndDate] = useState(
//     () => today()
//   );


//   /* -------------------------------------------------------
//      SEARCH
//   ------------------------------------------------------- */

//   const [search, setSearch] = useState("");


//   /* -------------------------------------------------------
//      LOADING / ERROR
//   ------------------------------------------------------- */

//   const [loading, setLoading] = useState(true);

//   const [error, setError] = useState("");


//   /* =======================================================
//      CURRENT MANAGER
//   ======================================================= */

//   const managerId =
//     localStorage.getItem(
//       EMPLOYEE_ID_STORAGE_KEY
//     ) || "";


//   /* =======================================================
//      LOAD DASHBOARD
//   ======================================================= */

//   async function loadDashboard(
//     selectedStart: string,
//     selectedEnd: string
//   ) {

//     if (!managerId) {

//       setError(
//         "Manager employee ID is missing."
//       );

//       setLoading(false);

//       return;
//     }


//     setLoading(true);

//     setError("");


//     try {

//       /* ---------------------------------------------------
//          GET EMPLOYEES
//       --------------------------------------------------- */

//       const allEmployees =
//         await utilizationApi.listTimeEntryEmployees();


//       /* ---------------------------------------------------
//          ONLY DIRECT REPORTS

//          Example:

//          E4 = Manager

//            E8 = Employee
//            E9 = Employee

//          Manager sees E8 and E9.
//       --------------------------------------------------- */

//       const linkedEmployees =
//         allEmployees.filter(
//           (employee) =>
//             employee.manager_id === managerId &&
//             employee.access_tier.toLowerCase() ===
//               "employee"
//         );


//       setEmployees(linkedEmployees);


//       /* ---------------------------------------------------
//          GET UTILIZATION FOR EACH EMPLOYEE
//       --------------------------------------------------- */

//       const dashboardResults =
//         await Promise.all(
//           linkedEmployees.map(
//             async (employee) => {

//               try {

//                 const dashboard =
//                   await utilizationApi.getPersonalDashboard(
//                     employee.employee_id,
//                     selectedStart,
//                     selectedEnd
//                   );


//                 return dashboard.summary;

//               } catch (err) {

//                 console.error(
//                   `Failed to load utilization for ${employee.employee_id}`,
//                   err
//                 );


//                 return null;
//               }
//             }
//           )
//         );


//       /* ---------------------------------------------------
//          REMOVE FAILED RESULTS
//       --------------------------------------------------- */

//       const validResults =
//         dashboardResults.filter(
//           (
//             item
//           ): item is UtilizationSummary =>
//             item !== null
//         );


//       setUtilization(validResults);

//     } catch (err) {

//       console.error(err);


//       setError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't load manager dashboard."
//       );


//       setEmployees([]);

//       setUtilization([]);

//     } finally {

//       setLoading(false);
//     }
//   }


//   /* =======================================================
//      INITIAL LOAD
//   ======================================================= */

//   useEffect(() => {

//     loadDashboard(
//       startDate,
//       endDate
//     );

//     // Initial load only.
//     // Dates are applied using Apply button.

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);


//   /* =======================================================
//      APPLY DATE FILTER
//   ======================================================= */

//   function handleApplyDates(
//     e: FormEvent
//   ) {

//     e.preventDefault();


//     if (!startDate || !endDate) {

//       setError(
//         "Please select both dates."
//       );

//       return;
//     }


//     if (startDate > endDate) {

//       setError(
//         "Start date cannot be after end date."
//       );

//       return;
//     }


//     loadDashboard(
//       startDate,
//       endDate
//     );
//   }


//   /* =======================================================
//      SEARCH EMPLOYEES
//   ======================================================= */

//   const searchText =
//     search.trim().toLowerCase();


//   const filteredEmployees =
//     employees.filter(
//       (employee) => {

//         if (!searchText) {
//           return true;
//         }


//         const employeeId =
//           employee.employee_id
//             .toLowerCase();


//         const employeeName =
//           employee.name
//             .toLowerCase();


//         return (
//           employeeId.includes(searchText) ||
//           employeeName.includes(searchText)
//         );
//       }
//     );


//   /* =======================================================
//      GET UTILIZATION SUMMARY
//   ======================================================= */

//   function getSummary(
//     employeeId: string
//   ): UtilizationSummary | undefined {

//     return utilization.find(
//       (item) =>
//         item.employee_id === employeeId
//     );
//   }


//   /* =======================================================
//      FLAG TEXT
//   ======================================================= */

//   function getFlagText(
//     flag: UtilizationSummary["flag"]
//   ): string {

//     if (flag === "under_utilized") {
//       return "under-utilized";
//     }


//     if (flag === "over_allocated") {
//       return "over-allocated";
//     }


//     return "on track";
//   }


//   /* =======================================================
//      FLAG CSS
//   ======================================================= */

//   function getFlagClass(
//     flag: UtilizationSummary["flag"]
//   ): string {

//     if (flag === "under_utilized") {

//       return (
//         "manager-flag " +
//         "manager-flag--warning"
//       );
//     }


//     if (flag === "over_allocated") {

//       return (
//         "manager-flag " +
//         "manager-flag--danger"
//       );
//     }


//     return (
//       "manager-flag " +
//       "manager-flag--ok"
//     );
//   }


//   /* =======================================================
//      RENDER
//   ======================================================= */

//   return (

//     <div className="manager-dashboard">


//       {/* =================================================
//           HEADER
//       ================================================= */}

//       <header className="manager-dashboard__header">

//         <h1>
//           Manager Dashboard
//         </h1>


//         <p>
//           View utilization for your linked employees.
//         </p>

//       </header>



//       {/* =================================================
//           ERROR
//       ================================================= */}

//       {error && (

//         <div className="manager-error">
//           {error}
//         </div>

//       )}



//       {/* =================================================
//           UTILIZATION CARD
//       ================================================= */}

//       <section className="manager-card">


//         <h2>
//           Utilization by employee
//         </h2>



//         {/* ===============================================
//             SEARCH BAR
//         =============================================== */}

//         <div className="manager-search">

//           <input
//             type="text"
//             value={search}
//             onChange={(e) =>
//               setSearch(e.target.value)
//             }
//             placeholder="Search by employee name or ID..."
//             aria-label="Search employees"
//           />

//         </div>



//         {/* ===============================================
//             DATE FILTER
//         =============================================== */}

//         <form
//           className="manager-filters"
//           onSubmit={handleApplyDates}
//         >


//           <label>

//             <span>
//               Start date
//             </span>


//             <input
//               type="date"
//               value={startDate}
//               onChange={(e) =>
//                 setStartDate(
//                   e.target.value
//                 )
//               }
//             />

//           </label>



//           <label>

//             <span>
//               End date
//             </span>


//             <input
//               type="date"
//               value={endDate}
//               onChange={(e) =>
//                 setEndDate(
//                   e.target.value
//                 )
//               }
//             />

//           </label>



//           <button
//             type="submit"
//             disabled={loading}
//           >

//             {loading
//               ? "Loading..."
//               : "Apply"}

//           </button>

//         </form>



//         {/* ===============================================
//             LOADING
//         =============================================== */}

//         {loading && (

//           <div className="manager-status">
//             Loading utilization...
//           </div>

//         )}



//         {/* ===============================================
//             NO LINKED EMPLOYEES
//         =============================================== */}

//         {!loading &&
//           employees.length === 0 &&
//           !error && (

//             <p className="manager-empty">

//               No employees are linked to you.

//             </p>

//         )}



//         {/* ===============================================
//             SEARCH RESULT EMPTY
//         =============================================== */}

//         {!loading &&
//           employees.length > 0 &&
//           filteredEmployees.length === 0 && (

//             <p className="manager-empty">

//               No employees found for "{search}".

//             </p>

//         )}



//         {/* ===============================================
//             TABLE
//         =============================================== */}

//         {!loading &&
//           filteredEmployees.length > 0 && (

//             <div className="manager-table-wrapper">


//               <table className="manager-table">


//                 {/* =====================================
//                     TABLE HEADER
//                 ===================================== */}

//                 <thead>

//                   <tr>

//                     <th>
//                       ID
//                     </th>


//                     <th>
//                       Name
//                     </th>


//                     <th>
//                       Billable Hours
//                     </th>


//                     <th>
//                       Available Hours
//                     </th>


//                     <th>
//                       Utilization
//                     </th>


//                     <th>
//                       Flag
//                     </th>

//                   </tr>

//                 </thead>



//                 {/* =====================================
//                     TABLE BODY
//                 ===================================== */}

//                 <tbody>


//                   {filteredEmployees.map(
//                     (employee) => {


//                       const summary =
//                         getSummary(
//                           employee.employee_id
//                         );


//                       /*
//                        * If utilization data is
//                        * unavailable, keep employee
//                        * visible instead of removing
//                        * them from the table.
//                        */

//                       const billableHours =
//                         summary?.billable_hours ?? 0;


//                       const availableHours =
//                         summary?.available_hours ?? 0;


//                       const utilizationPct =
//                         summary?.utilization_pct ?? 0;


//                       const flag =
//                         summary?.flag ?? null;



//                       return (

//                         <tr
//                           key={
//                             employee.employee_id
//                           }
//                         >


//                           {/* =========================
//                               ID
//                           ========================= */}

//                           <td>

//                             <span className="employee-id">

//                               {
//                                 employee.employee_id
//                               }

//                             </span>

//                           </td>



//                           {/* =========================
//                               NAME
//                           ========================= */}

//                           <td>

//                             <span className="employee-name">

//                               {
//                                 employee.name
//                               }

//                             </span>

//                           </td>



//                           {/* =========================
//                               BILLABLE HOURS
//                           ========================= */}

//                           <td>

//                             {
//                               billableHours.toFixed(1)
//                             }
//                             h

//                           </td>



//                           {/* =========================
//                               AVAILABLE HOURS
//                           ========================= */}

//                           <td>

//                             {
//                               availableHours.toFixed(1)
//                             }
//                             h

//                           </td>



//                           {/* =========================
//                               UTILIZATION
//                           ========================= */}

//                           <td>

//                             <span className="utilization-value">

//                               {
//                                 Math.round(
//                                   utilizationPct *
//                                     100
//                                 )
//                               }
//                               %

//                             </span>

//                           </td>



//                           {/* =========================
//                               FLAG
//                           ========================= */}

//                           <td>

//                             <span
//                               className={
//                                 getFlagClass(
//                                   flag
//                                 )
//                               }
//                             >

//                               {
//                                 getFlagText(
//                                   flag
//                                 )
//                               }

//                             </span>

//                           </td>


//                         </tr>

//                       );
//                     }
//                   )}


//                 </tbody>

//               </table>


//             </div>

//         )}


//       </section>


//     </div>

//   );
// }

import { useEffect, useState, type FormEvent } from "react";

import {
  utilizationApi,
  type TimeEntryEmployee,
  type UtilizationSummary,
} from "../api";

import "./ManagerOrgDashboard.css";

const EMPLOYEE_ID_STORAGE_KEY =
  "uzvi_portal_employee_id";

/* =========================================================
   DATE HELPERS
========================================================= */

function toLocalISODate(
  d: Date
): string {
  const year = d.getFullYear();

  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function today(): string {
  return toLocalISODate(new Date());
}

function daysAgo(
  days: number
): string {
  const d = new Date();

  d.setDate(
    d.getDate() - days
  );

  return toLocalISODate(d);
}

/* =========================================================
   PAGE
========================================================= */

export function ManagerDashboardPage() {

  /* =========================================================
     EMPLOYEES
  ========================================================= */

  const [employees, setEmployees] =
    useState<TimeEntryEmployee[]>([]);

  /* =========================================================
     UTILIZATION
  ========================================================= */

  const [utilization, setUtilization] =
    useState<UtilizationSummary[]>([]);

  /* =========================================================
     DATES

     Last 7 days INCLUDING TODAY
  ========================================================= */

  const [startDate, setStartDate] =
    useState(() => daysAgo(6));

  const [endDate, setEndDate] =
    useState(() => today());

  /* =========================================================
     SEARCH
  ========================================================= */

  const [search, setSearch] =
    useState("");

  /* =========================================================
     LOADING / ERROR
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================================
     CURRENT MANAGER
  ========================================================= */

  const managerId =
    localStorage.getItem(
      EMPLOYEE_ID_STORAGE_KEY
    ) || "";

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  async function loadDashboard(
    selectedStart: string,
    selectedEnd: string
  ) {
    if (!managerId) {
      setError(
        "Manager employee ID is missing."
      );

      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const allEmployees =
        await utilizationApi.listTimeEntryEmployees();

      const linkedEmployees =
        allEmployees.filter(
          (employee) =>
            employee.manager_id ===
              managerId &&
            employee.access_tier
              .toLowerCase() ===
              "employee"
        );

      setEmployees(
        linkedEmployees
      );

      const dashboardResults =
        await Promise.all(
          linkedEmployees.map(
            async (employee) => {
              try {
                const dashboard =
                  await utilizationApi.getPersonalDashboard(
                    employee.employee_id,
                    selectedStart,
                    selectedEnd
                  );

                return dashboard.summary;
              } catch (err) {
                console.error(
                  `Failed to load utilization for ${employee.employee_id}`,
                  err
                );

                return null;
              }
            }
          )
        );

      const validResults =
        dashboardResults.filter(
          (
            item
          ): item is UtilizationSummary =>
            item !== null
        );

      setUtilization(
        validResults
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load manager dashboard."
      );

      setEmployees([]);
      setUtilization([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadDashboard(
      startDate,
      endDate
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     APPLY DATE FILTER
  ========================================================= */

  function handleApplyDates(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!startDate || !endDate) {
      setError(
        "Please select both dates."
      );

      return;
    }

    if (startDate > endDate) {
      setError(
        "Start date cannot be after end date."
      );

      return;
    }

    loadDashboard(
      startDate,
      endDate
    );
  }

  /* =========================================================
     SEARCH
  ========================================================= */

  const searchText =
    search
      .trim()
      .toLowerCase();

  const filteredEmployees =
    employees.filter(
      (employee) => {
        if (!searchText) {
          return true;
        }

        const employeeId =
          employee.employee_id
            .toLowerCase();

        const employeeName =
          employee.name
            .toLowerCase();

        return (
          employeeId.includes(
            searchText
          ) ||
          employeeName.includes(
            searchText
          )
        );
      }
    );

  /* =========================================================
     GET SUMMARY
  ========================================================= */

  function getSummary(
    employeeId: string
  ): UtilizationSummary | undefined {
    return utilization.find(
      (item) =>
        item.employee_id ===
        employeeId
    );
  }

  /* =========================================================
     FLAG TEXT
  ========================================================= */

  function getFlagText(
    flag: UtilizationSummary["flag"]
  ): string {
    if (
      flag === "under_utilized"
    ) {
      return "under-utilized";
    }

    if (
      flag === "over_allocated"
    ) {
      return "over-allocated";
    }

    return "on track";
  }

  /* =========================================================
     FLAG CSS
  ========================================================= */

  function getFlagClass(
    flag: UtilizationSummary["flag"]
  ): string {
    if (
      flag === "under_utilized"
    ) {
      return (
        "manager-flag " +
        "manager-flag--warning"
      );
    }

    if (
      flag === "over_allocated"
    ) {
      return (
        "manager-flag " +
        "manager-flag--danger"
      );
    }

    return (
      "manager-flag " +
      "manager-flag--ok"
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="manager-dashboard">

      <header className="manager-dashboard__header">
        <h1>
          Manager Dashboard
        </h1>

        <p>
          View utilization for your linked employees.
        </p>
      </header>

      {error && (
        <div className="manager-error">
          {error}
        </div>
      )}

      <section className="manager-card">

        <h2>
          Utilization by employee
        </h2>

        {/* SEARCH */}

        <div className="manager-search">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search by employee name or ID..."
            aria-label="Search employees"
          />
        </div>

        {/* DATE FILTER */}

        <form
          className="manager-filters"
          onSubmit={
            handleApplyDates
          }
        >

          <label>
            <span>
              Start date
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              End date
            </span>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(
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

        {/* LOADING */}

        {loading && (
          <div className="manager-status">
            Loading utilization...
          </div>
        )}

        {/* NO EMPLOYEES */}

        {!loading &&
          employees.length === 0 &&
          !error && (
            <p className="manager-empty">
              No employees are linked to you.
            </p>
          )}

        {/* SEARCH EMPTY */}

        {!loading &&
          employees.length > 0 &&
          filteredEmployees.length ===
            0 && (
            <p className="manager-empty">
              No employees found for "
              {search}".
            </p>
          )}

        {/* TABLE */}

        {!loading &&
          filteredEmployees.length >
            0 && (

            <div className="manager-table-wrapper">

              <table className="manager-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>
                      Billable Hours
                    </th>
                    <th>
                      Available Hours
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

                  {filteredEmployees.map(
                    (employee) => {

                      const summary =
                        getSummary(
                          employee.employee_id
                        );

                      const billableHours =
                        summary?.billable_hours ??
                        0;

                      const availableHours =
                        summary?.available_hours ??
                        0;

                      const utilizationPct =
                        summary?.utilization_pct ??
                        0;

                      const flag =
                        summary?.flag ??
                        null;

                      return (
                        <tr
                          key={
                            employee.employee_id
                          }
                        >

                          <td>
                            <span className="employee-id">
                              {
                                employee.employee_id
                              }
                            </span>
                          </td>

                          <td>
                            <span className="employee-name">
                              {
                                employee.name
                              }
                            </span>
                          </td>

                          <td>
                            {
                              billableHours.toFixed(
                                1
                              )
                            }
                            h
                          </td>

                          <td>
                            {
                              availableHours.toFixed(
                                1
                              )
                            }
                            h
                          </td>

                          <td>
                            <span className="utilization-value">
                              {Math.round(
                                utilizationPct *
                                  100
                              )}
                              %
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                getFlagClass(
                                  flag
                                )
                              }
                            >
                              {
                                getFlagText(
                                  flag
                                )
                              }
                            </span>
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

      </section>
    </div>
  );
}