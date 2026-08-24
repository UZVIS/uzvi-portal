import { useEffect, useState } from "react";

import {
  utilizationApi,
  type Project,
  type PersonalDashboard,
  type TimeEntry,
} from "./api";

import { useAuth } from "../../shared/auth/AuthContext";

import { UtilizationSummaryCard } from "./components/UtilizationSummaryCard";

import {
  TimeEntryForm,
  type TimeEntryEmployee,
} from "./components/TimeEntryForm";

import "./ConsultantUtilizationPage.css";

/* =========================================================
   DATE HELPER

   IMPORTANT:
   Do NOT use toISOString() here.

   toISOString() converts local IST time to UTC and can
   move the date one day backwards.

   Example:
   India: 2026-08-19
   UTC:   2026-08-18

   So we format the local date manually.
========================================================= */

function toLocalISODate(d: Date): string {
  const year = d.getFullYear();

  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   GET DATE N DAYS AGO
========================================================= */

function isoDateNDaysAgo(n: number): string {
  const d = new Date();

  d.setDate(
    d.getDate() - n
  );

  return toLocalISODate(d);
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export function ConsultantUtilizationPage() {
  const { employee } = useAuth();

  const currentEmployeeId =
    employee?.employee_id ?? "";


  /* =======================================================
     STATE
  ======================================================= */

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [dashboard, setDashboard] =
    useState<PersonalDashboard | null>(null);

  const [recentEntries, setRecentEntries] =
    useState<TimeEntry[]>([]);

  /*
   * Employees that the logged-in user
   * is allowed to log hours for.
   */
  const [timeEntryEmployees, setTimeEntryEmployees] =
    useState<TimeEntryEmployee[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [otNotice, setOtNotice] =
    useState<string | null>(null);


  /* =======================================================
     AUTO-HIDE OT NOTICE

     The overtime message remains visible
     for only 4 seconds.
  ======================================================= */

  useEffect(() => {
    if (!otNotice) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setOtNotice(null);
      }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [otNotice]);


  /* =======================================================
     DATE RANGE

     "Last 7 days INCLUDING TODAY"

     Start = 6 days ago
     End   = today
  ======================================================= */

  const periodStart =
    isoDateNDaysAgo(6);

  const periodEnd =
    isoDateNDaysAgo(0);


  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  async function loadDashboard() {
    if (!currentEmployeeId) {
      return;
    }

    const [
      projectList,
      personalDashboard,
      entries,
      allowedEmployees,
    ] = await Promise.all([

      /* Projects */
      utilizationApi.listProjects(),

      /* Personal dashboard */
      utilizationApi.getPersonalDashboard(
        currentEmployeeId,
        periodStart,
        periodEnd
      ),

      /* Recent entries */
      utilizationApi.listTimeEntries(
        currentEmployeeId,
        periodStart,
        periodEnd
      ),

      /* Employees allowed for time entry */
      utilizationApi.listTimeEntryEmployees(),
    ]);


    /* =====================================================
       UPDATE STATE
    ===================================================== */

    setProjects(projectList);

    setDashboard(
      personalDashboard
    );


    /*
     * Sort recent entries:
     * newest date first
     */
    setRecentEntries(
      [...entries].sort(
        (a, b) =>
          a.date < b.date ? 1 : -1
      )
    );


    setTimeEntryEmployees(
      allowedEmployees
    );
  }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (!currentEmployeeId) {
      return;
    }

    setLoading(true);

    setLoadError(null);

    loadDashboard()
      .catch((err) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Couldn't load your dashboard."
        );
      })
      .finally(() => {
        setLoading(false);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployeeId]);


  /* =======================================================
     LOG HOURS
  ======================================================= */

  async function handleLogHours(entry: {
    employeeId: string;
    projectId: string;
    date: string;
    hours: number;
    billable: boolean;
    notes?: string;
  }) {

    /*
     * Clear any old OT notice before creating
     * a new entry.
     */
    setOtNotice(null);


    /* =====================================================
       CREATE TIME ENTRY
    ===================================================== */

    const saved =
      await utilizationApi.createTimeEntry({

        entry_id:
          `TE-${entry.employeeId}-${entry.projectId}-${entry.date}-${Date.now()}`,

        /*
         * Use the employee selected in the form.
         */
        employee_id:
          entry.employeeId,

        project_id:
          entry.projectId,

        date:
          entry.date,

        hours:
          entry.hours,

        billable_flag:
          entry.billable,

        notes:
          entry.notes || undefined,
      });


    /* =====================================================
       OT MESSAGE
    ===================================================== */

    if (
      saved.ot_status === "Pending"
    ) {

      setOtNotice(
        `This includes ${saved.overtime_hours}h of overtime. ` +
        `It has been sent to your manager for approval. ` +
        `It won't count toward your utilization until approved.`
      );

    } else {

      /*
       * Top-of-chain Admin/Leadership has
       * OT auto-approved, so no notice is shown.
       */
      setOtNotice(null);
    }


    /* =====================================================
       RELOAD DASHBOARD AFTER SUCCESSFUL SAVE
    ===================================================== */

    await loadDashboard();
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    !currentEmployeeId ||
    loading
  ) {
    return (
      <div className="cu-page cu-page--status">
        Loading your utilization…
      </div>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (loadError) {
    return (
      <div className="cu-page cu-page--status cu-page--error">
        Couldn't load this page:
        {" "}
        {loadError}
      </div>
    );
  }


  /* =======================================================
     NO DASHBOARD
  ======================================================= */

  if (!dashboard) {
    return null;
  }


  /* =======================================================
     HOURS BY PROJECT
  ======================================================= */

  const projectRows =
    (
      Object.entries(
        dashboard.hours_by_project
      ) as [string, number][]
    ).sort(
      (a, b) => b[1] - a[1]
    );


  /* =======================================================
     WEEKLY TREND
  ======================================================= */

  const trendRows =
    (
      Object.entries(
        dashboard.weekly_trend
      ) as [string, number][]
    ).sort(
      (a, b) =>
        a[0] > b[0] ? 1 : -1
    );


  const maxTrendHours =
    Math.max(
      1,
      ...trendRows.map(
        ([, hours]) => hours
      )
    );


  /* =======================================================
     DECISION DISPLAY HELPER

     IMPORTANT:
     Backend field is:

       ot_decided_by_name

     and:

       ot_decided_by_role

     So we MUST use those exact fields.
  ======================================================= */

  function getDecisionDisplay(
    entry: TimeEntry
  ): string {

    const decidedByName =
      entry.ot_decided_by_name ||
      "";

    if (!decidedByName) {
      return "—";
    }

    const status =
      (entry.ot_status || "")
        .trim()
        .toLowerCase();

    if (status === "approved") {
      return `Approved by ${decidedByName}`;
    }

    if (status === "rejected") {
      return `Rejected by ${decidedByName}`;
    }

    return "—";
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="cu-page">


      {/* ===================================================
          TITLE
      =================================================== */}

      <h1 className="cu-page__title">
        Consultant Utilization
      </h1>


      {/* ===================================================
          DATE RANGE
      =================================================== */}

      <p className="cu-page__subtitle">
        Last 7 days · {periodStart} to {periodEnd}
      </p>


      {/* ===================================================
          SUMMARY CARD
      =================================================== */}

      <UtilizationSummaryCard
        summary={dashboard.summary}
      />


      {/* ===================================================
          DASHBOARD GRID
      =================================================== */}

      <div className="cu-page__grid">


        {/* =================================================
            HOURS BY PROJECT
        ================================================= */}

        <section className="cu-panel">

          <h2 className="cu-panel__title">
            Hours by project
          </h2>


          {projectRows.length === 0 ? (

            <p className="cu-panel__empty">
              No hours logged in this period yet.
            </p>

          ) : (

            <table className="cu-table">

              <thead>

                <tr>

                  <th>
                    Project
                  </th>

                  <th>
                    Hours
                  </th>

                </tr>

              </thead>


              <tbody>

                {projectRows.map(
                  ([projectId, hours]) => (

                    <tr
                      key={projectId}
                    >

                      <td>
                        {
                          projects.find(
                            (p: Project) =>
                              p.project_id ===
                              projectId
                          )?.name ??
                          projectId
                        }
                      </td>


                      <td>
                        {hours.toFixed(1)}h
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </section>


        {/* =================================================
            WEEKLY TREND
        ================================================= */}

        <section className="cu-panel">

          <h2 className="cu-panel__title">
            Weekly trend
          </h2>


          {trendRows.length === 0 ? (

            <p className="cu-panel__empty">
              Nothing to trend yet.
            </p>

          ) : (

            <div className="cu-trend">

              {trendRows.map(
                ([week, hours]) => (

                  <div
                    className="cu-trend__row"
                    key={week}
                  >

                    <span className="cu-trend__label">
                      {week}
                    </span>


                    <div className="cu-trend__bar-track">

                      <div
                        className="cu-trend__bar"
                        style={{
                          width:
                            `${(hours / maxTrendHours) * 100}%`,
                        }}
                      />

                    </div>


                    <span className="cu-trend__value">
                      {hours.toFixed(1)}h
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>


      {/* ===================================================
          LOG HOURS FORM
      =================================================== */}

      <TimeEntryForm
        projects={projects}
        employees={timeEntryEmployees}
        currentEmployeeId={
          currentEmployeeId
        }
        onSubmit={
          handleLogHours
        }
      />


      {/* ===================================================
          OT NOTICE

          Automatically disappears after 4 seconds.
      =================================================== */}

      {otNotice && (

        <p className="cu-ot-notice">
          {otNotice}
        </p>

      )}


      {/* ===================================================
          RECENT ENTRIES
      =================================================== */}

      <section className="cu-panel cu-panel--entries">

        <h2 className="cu-panel__title">
          Recent entries
        </h2>


        {recentEntries.length === 0 ? (

          <p className="cu-panel__empty">
            No entries logged in this period yet.
          </p>

        ) : (

          <table className="cu-table cu-table--entries">

            <thead>

              <tr>

                <th>
                  Date
                </th>

                <th>
                  Project
                </th>

                <th>
                  Hours
                </th>

                <th>
                  Normal
                </th>

                <th>
                  OT
                </th>

                <th>
                  OT status
                </th>

                <th>
                  Decided by
                </th>

                <th>
                  Billable
                </th>

                <th>
                  Notes
                </th>

              </tr>

            </thead>


            <tbody>

              {recentEntries.map(
                (entry) => (

                  <tr
                    key={entry.entry_id}
                  >

                    <td>
                      {entry.date}
                    </td>


                    <td>

                      {
                        projects.find(
                          (p: Project) =>
                            p.project_id ===
                            entry.project_id
                        )?.name ??
                        entry.project_id
                      }

                    </td>


                    <td>
                      {entry.hours.toFixed(1)}h
                    </td>


                    <td>
                      {entry.normal_hours.toFixed(1)}h
                    </td>


                    <td
                      className={
                        entry.overtime_hours > 0
                          ? "cu-table__ot"
                          : undefined
                      }
                    >

                      {entry.overtime_hours > 0
                        ? `${entry.overtime_hours.toFixed(1)}h`
                        : "—"}

                    </td>


                    <td>

                      {entry.ot_status ? (

                        <span
                          className={
                            `cu-ot-badge cu-ot-badge--${entry.ot_status.toLowerCase()}`
                          }
                        >
                          {entry.ot_status}
                        </span>

                      ) : (

                        "—"

                      )}

                    </td>


                    {/* =================================================
                        DECIDED BY

                        Uses:
                          ot_decided_by_name

                        Example:
                          Approved by Yeswanth
                    ================================================= */}

                    <td>
                      {getDecisionDisplay(entry)}
                    </td>


                    <td>

                      {entry.billable_flag
                        ? "Yes"
                        : "No"}

                    </td>


                    <td
                      className="cu-table__notes"
                      title={
                        entry.notes ??
                        undefined
                      }
                    >

                      {entry.notes ? (

                        entry.notes

                      ) : (

                        <span className="cu-panel__empty-inline">
                          —
                        </span>

                      )}

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </section>

    </div>
  );
}