import {
  useState,
  useEffect,
  useRef,
} from "react";

import type { Project } from "../api";

import flatpickr from "flatpickr";

import "flatpickr/dist/flatpickr.min.css";

import "./TimeEntryForm.css";


export interface TimeEntryEmployee {
  employee_id: string;
  name: string;
  designation: string | null;
  manager_id: string | null;
  access_tier: string;
}


interface Props {
  projects: Project[];

  employees: TimeEntryEmployee[];

  currentEmployeeId: string;

  onSubmit: (entry: {
    employeeId: string;
    projectId: string;
    date: string;
    hours: number;
    billable: boolean;
    notes: string;
  }) => Promise<void>;
}


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


async function fetchApprovedLeaveDates(
  employeeId: string
): Promise<string[]> {

  try {

    const res = await fetch(
      `/api/v1/leave/applications?employee_id=${encodeURIComponent(
        employeeId
      )}&role=Employee`
    );

    if (!res.ok) {
      return [];
    }

    const applications: {
      start_date: string;
      end_date: string;
      status: string;
    }[] = await res.json();

    const dates: string[] = [];

    for (const app of applications) {

      if (app.status !== "APPROVED") {
        continue;
      }

      const start = new Date(
        app.start_date + "T00:00:00"
      );

      const end = new Date(
        app.end_date + "T00:00:00"
      );

      for (
        let d = new Date(start);
        d <= end;
        d.setDate(
          d.getDate() + 1
        )
      ) {
        dates.push(
          toLocalISODate(d)
        );
      }
    }

    return dates;

  } catch {

    return [];

  }
}


export function TimeEntryForm({
  projects,
  currentEmployeeId,
  onSubmit,
}: Props) {

  const employeeId =
    currentEmployeeId;


  const [
    projectId,
    setProjectId,
  ] = useState(
    projects[0]?.project_id ?? ""
  );


  const [
    date,
    setDate,
  ] = useState(() =>
    toLocalISODate(
      new Date()
    )
  );


  const [
    hours,
    setHours,
  ] = useState("");


  const [
    billable,
    setBillable,
  ] = useState(true);


  const [
    notes,
    setNotes,
  ] = useState("");


  const [
    status,
    setStatus,
  ] = useState<
    "idle" |
    "saving" |
    "saved" |
    "error"
  >("idle");


  const [
    errorMsg,
    setErrorMsg,
  ] = useState("");


  const [
    leaveDates,
    setLeaveDates,
  ] = useState<string[]>([]);


  const dateInputRef =
    useRef<HTMLInputElement>(null);


  const flatpickrRef =
    useRef<
      flatpickr.Instance | null
    >(null);


  /*
   * ----------------------------------------------------------
   * LOAD APPROVED LEAVE DATES
   * ----------------------------------------------------------
   */

  useEffect(() => {

    let cancelled = false;

    fetchApprovedLeaveDates(
      employeeId
    ).then((dates) => {

      if (!cancelled) {
        setLeaveDates(dates);
      }

    });

    return () => {
      cancelled = true;
    };

  }, [employeeId]);


  /*
   * ----------------------------------------------------------
   * AUTO-HIDE ALL TEMPORARY MESSAGES
   * ----------------------------------------------------------
   *
   * Both SUCCESS and ERROR messages stay visible for
   * 4 seconds and then disappear automatically.
   *
   * Examples:
   *
   * Logged.
   * You are on leave...
   * Weekends are not working days...
   * Select a project...
   * Couldn't save this entry.
   *
   */

  useEffect(() => {

    if (
      status !== "saved" &&
      status !== "error"
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {

        setStatus("idle");

        setErrorMsg("");

      }, 4000);


    return () => {

      window.clearTimeout(
        timer
      );

    };

  }, [status]);


  /*
   * ----------------------------------------------------------
   * INITIALIZE DATE PICKER
   * ----------------------------------------------------------
   */

  useEffect(() => {

    if (!dateInputRef.current) {
      return;
    }

    flatpickrRef.current?.destroy();


    flatpickrRef.current =
      flatpickr(
        dateInputRef.current,
        {
          dateFormat: "Y-m-d",

          defaultDate: date,

          maxDate:
            toLocalISODate(
              new Date()
            ),

          disable: [

            /*
             * Saturday
             */
            (d) =>
              d.getDay() === 6,

            /*
             * Sunday
             */
            (d) =>
              d.getDay() === 0,

            /*
             * Approved leave
             */
            (d) =>
              leaveDates.includes(
                toLocalISODate(d)
              ),

          ],

          onChange: (
            [selected]
          ) => {

            if (selected) {

              setDate(
                toLocalISODate(
                  selected
                )
              );

            }

          },

          onDayCreate: (
            _dObj,
            _dStr,
            _fp,
            dayElem
          ) => {

            const cellDate =
              toLocalISODate(
                dayElem.dateObj
              );


            if (
              leaveDates.includes(
                cellDate
              )
            ) {

              dayElem.title =
                "You're on approved leave this day";

            }

          },

        }
      );


    return () => {

      flatpickrRef.current?.destroy();

    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveDates]);


  /*
   * ----------------------------------------------------------
   * SUBMIT
   * ----------------------------------------------------------
   */

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();


    const parsedHours =
      parseFloat(hours);


    /*
     * Employee validation
     */

    if (!employeeId) {

      setStatus("error");

      setErrorMsg(
        "Unable to identify the logged-in employee."
      );

      return;

    }


    /*
     * Project / hours validation
     */

    if (
      !projectId ||
      !parsedHours ||
      parsedHours <= 0
    ) {

      setStatus("error");

      setErrorMsg(
        "Select a project and enter hours greater than 0."
      );

      return;

    }


    /*
     * Weekend validation
     */

    const dayOfWeek =
      new Date(
        date + "T00:00:00"
      ).getDay();


    if (
      dayOfWeek === 0 ||
      dayOfWeek === 6
    ) {

      setStatus("error");

      setErrorMsg(
        "Weekends are not working days. Pick a weekday (Monday-Friday)."
      );

      return;

    }


    /*
     * Leave validation
     */

    if (
      leaveDates.includes(date)
    ) {

      setStatus("error");

      setErrorMsg(
        "You are on leave. You can't log hours for this date."
      );

      return;

    }


    /*
     * Start saving
     */

    setStatus("saving");

    setErrorMsg("");


    try {

      await onSubmit({

        employeeId,

        projectId,

        date,

        hours: parsedHours,

        billable,

        notes,

      });


      /*
       * Clear input fields after successful save
       */

      setHours("");

      setNotes("");


      /*
       * Show success message.
       * The useEffect above automatically
       * hides it after 4 seconds.
       */

      setStatus("saved");


    } catch (err) {

      /*
       * Show error message.
       * The useEffect above automatically
       * hides it after 4 seconds.
       */

      setStatus("error");


      setErrorMsg(

        err instanceof Error
          ? err.message
          : "Couldn't save this entry."

      );

    }

  }


  /*
   * ----------------------------------------------------------
   * UI
   * ----------------------------------------------------------
   */

  return (

    <form
      className="entry-form"
      onSubmit={handleSubmit}
    >

      <h3 className="entry-form__title">
        Log hours
      </h3>


      {/* ======================================================
          PROJECT / DATE / HOURS
          ====================================================== */}

      <div className="entry-form__row">


        {/* PROJECT */}

        <label>

          Project

          <select
            value={projectId}
            onChange={(e) =>
              setProjectId(
                e.target.value
              )
            }
          >

            {projects.map(
              (project) => (

                <option
                  key={
                    project.project_id
                  }
                  value={
                    project.project_id
                  }
                >
                  {project.name}
                </option>

              )
            )}

          </select>

        </label>


        {/* DATE */}

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


            <span
              className="entry-form__date-icon"
              aria-hidden="true"
            >

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                />

                <line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                />

                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                />

                <line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                />

              </svg>

            </span>

          </div>

        </label>


        {/* HOURS */}

        <label>

          Hours

          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="0"
            value={hours}
            onChange={(e) =>
              setHours(
                e.target.value
              )
            }
          />

        </label>

      </div>


      {/* ======================================================
          BILLABLE
          ====================================================== */}

      <label className="entry-form__checkbox">

        <input
          type="checkbox"
          checked={billable}
          onChange={(e) =>
            setBillable(
              e.target.checked
            )
          }
        />

        Billable

      </label>


      {/* ======================================================
          NOTES
          ====================================================== */}

      <label className="entry-form__notes">

        Notes

        <textarea
          placeholder="What was this for? (optional)"
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
        />

      </label>


      {/* ======================================================
          SUBMIT BUTTON
          ====================================================== */}

      <button
        type="submit"
        disabled={
          status === "saving"
        }
      >

        {status === "saving"
          ? "Saving..."
          : "Log hours"}

      </button>


      {/* ======================================================
          ERROR MESSAGE
          ====================================================== */}

      {status === "error" && (

        <p className="entry-form__error">

          {errorMsg}

        </p>

      )}


      {/* ======================================================
          SUCCESS MESSAGE
          ====================================================== */}

      {status === "saved" && (

        <p className="entry-form__success">

          Logged.

        </p>

      )}

    </form>

  );

}