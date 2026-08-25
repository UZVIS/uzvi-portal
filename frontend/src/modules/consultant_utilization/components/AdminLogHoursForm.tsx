import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "./TimeEntryForm.css";

/* =========================================================
   TYPES
========================================================= */

type TimeEntryEmployee = {
  employee_id: string;
  name: string;
};

type Project = {
  project_id: string;
  name?: string;
  project_name?: string;
};

type TimeEntryInput = {
  employeeId: string;
  projectId: string;
  date: string;
  hours: number;
  billable: boolean;
};

type AdminLogHoursFormProps = {
  employees: TimeEntryEmployee[];
  projects: Project[];

  onSubmit: (
    input: TimeEntryInput
  ) => void | Promise<void>;
};

/* =========================================================
   DATE HELPER

   Never use toISOString() for local dates - it converts to
   UTC first, which shifts the date backward for any timezone
   ahead of UTC (e.g. India, UTC+5:30).
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

/* =========================================================
   COMPONENT
========================================================= */

export function AdminLogHoursForm({
  employees,
  projects,
  onSubmit,
}: AdminLogHoursFormProps) {

  const [
    employeeSearch,
    setEmployeeSearch,
  ] = useState("");

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState("");

  const [
    projectId,
    setProjectId,
  ] = useState("");

  const [date, setDate] =
    useState(() =>
      toLocalISODate(new Date())
    );

  const [hours, setHours] =
    useState("");

  const [billable, setBillable] =
    useState(true);

  const [
    showEmployeeDropdown,
    setShowEmployeeDropdown,
  ] = useState(false);

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [errorMsg, setErrorMsg] =
    useState("");

  const employeeSearchRef =
    useRef<HTMLDivElement>(null);

  const dateInputRef =
    useRef<HTMLInputElement>(null);

  const flatpickrRef =
    useRef<flatpickr.Instance | null>(null);

  /* =========================================================
     CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        employeeSearchRef.current &&
        !employeeSearchRef.current.contains(
          event.target as Node
        )
      ) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =========================================================
     INITIALIZE DATE PICKER
     Weekends disabled, matching the employee Log Hours form.
  ========================================================= */

  useEffect(() => {
    if (!dateInputRef.current) return;

    flatpickrRef.current = flatpickr(
      dateInputRef.current,
      {
        dateFormat: "Y-m-d",
        defaultDate: date,
        maxDate: toLocalISODate(new Date()),

        disable: [
          (d) =>
            d.getDay() === 0 ||
            d.getDay() === 6,
        ],

        onChange: ([selected]) => {
          if (selected) {
            setDate(
              toLocalISODate(selected)
            );
            // Clear any stale error once a valid date is picked
            setStatus("idle");
            setErrorMsg("");
          }
        },
      }
    );

    return () => {
      flatpickrRef.current?.destroy();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     FILTER EMPLOYEES
  ========================================================= */

  const search =
    employeeSearch
      .trim()
      .toLowerCase();

  const filteredEmployees =
    employees.filter(
      (employee) => {
        if (!search) {
          return true;
        }

        return (
          employee.employee_id
            .toLowerCase()
            .includes(search) ||
          employee.name
            .toLowerCase()
            .includes(search)
        );
      }
    );

  /* =========================================================
     PROJECT NAME
  ========================================================= */

  const getProjectName = (
    project: Project
  ): string => {
    return (
      project.name ??
      project.project_name ??
      project.project_id
    );
  };

  /* =========================================================
     SELECT EMPLOYEE
  ========================================================= */

  const handleEmployeeSelect = (
    employee: TimeEntryEmployee
  ) => {
    setSelectedEmployeeId(
      employee.employee_id
    );

    setEmployeeSearch(
      `${employee.employee_id} - ${employee.name}`
    );

    setShowEmployeeDropdown(false);
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedEmployeeId) {
      setStatus("error");
      setErrorMsg(
        "Please select an employee."
      );
      return;
    }

    if (!projectId) {
      setStatus("error");
      setErrorMsg(
        "Please select a project."
      );
      return;
    }

    if (!date) {
      setStatus("error");
      setErrorMsg(
        "Please select a date."
      );
      return;
    }

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

    const numericHours =
      Number(hours);

    if (
      !hours ||
      Number.isNaN(numericHours) ||
      numericHours <= 0
    ) {
      setStatus("error");
      setErrorMsg(
        "Please enter valid hours."
      );
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    try {
      await onSubmit({
        employeeId:
          selectedEmployeeId,

        projectId,

        date,

        hours:
          numericHours,

        billable,
      });

      setEmployeeSearch("");
      setSelectedEmployeeId("");
      setProjectId("");
      setHours("");
      setBillable(true);
      setShowEmployeeDropdown(false);

      setStatus("saved");
    } catch (err) {
      setStatus("error");

      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Couldn't log these hours."
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="manager-card admin-log-hours-card">

      <h2>
        Log hours for an employee
      </h2>

      <form
        className="manager-form"
        onSubmit={handleSubmit}
      >

        {/* EMPLOYEE */}

        <label>
          <span>Employee</span>

          <div
            className="employee-search-wrapper"
            ref={employeeSearchRef}
          >
            <input
              type="text"
              className="admin-log-hours-input"
              placeholder="Search by employee ID or name..."
              value={employeeSearch}
              onFocus={() =>
                setShowEmployeeDropdown(true)
              }
              onChange={(event) => {
                setEmployeeSearch(
                  event.target.value
                );

                setSelectedEmployeeId("");

                setShowEmployeeDropdown(
                  true
                );

                setStatus("idle");
                setErrorMsg("");
              }}
              autoComplete="off"
            />

            {showEmployeeDropdown && (
              <div className="employee-search-dropdown">

                {filteredEmployees.length ===
                0 ? (
                  <div className="employee-search-empty">
                    No employees found
                  </div>
                ) : (
                  filteredEmployees.map(
                    (employee) => (
                      <button
                        key={
                          employee.employee_id
                        }
                        type="button"
                        className="employee-search-option"
                        onClick={() =>
                          handleEmployeeSelect(
                            employee
                          )
                        }
                      >
                        <span className="employee-option-id">
                          {
                            employee.employee_id
                          }
                        </span>

                        <span className="employee-option-name">
                          {employee.name}
                        </span>
                      </button>
                    )
                  )
                )}

              </div>
            )}
          </div>
        </label>

        {/* PROJECT */}

        <label>
          <span>Project</span>

          <select
            value={projectId}
            onChange={(event) => {
              setProjectId(
                event.target.value
              );
              setStatus("idle");
              setErrorMsg("");
            }}
          >
            <option value="">
              Select project
            </option>

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
                  {getProjectName(
                    project
                  )}
                </option>
              )
            )}
          </select>
        </label>

        {/* DATE */}

        <label>
          <span>Date</span>

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
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
          </div>
        </label>

        {/* HOURS */}

        <label>
          <span>Hours</span>

          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="0"
            value={hours}
            onChange={(event) => {
              setHours(
                event.target.value
              );
              setStatus("idle");
              setErrorMsg("");
            }}
          />
        </label>

        {/* BILLABLE */}

        <label className="manager-checkbox">
          <input
            type="checkbox"
            checked={billable}
            onChange={(event) =>
              setBillable(
                event.target.checked
              )
            }
          />

          <span>Billable</span>
        </label>

        {/* BUTTON */}

        <button
          type="submit"
          disabled={
            !selectedEmployeeId ||
            !projectId ||
            !hours ||
            status === "saving"
          }
        >
          {status === "saving"
            ? "Logging..."
            : "Log hours"}
        </button>

        {/* ERROR */}

        {status === "error" && (
          <div className="admin-log-hours-error">
            {errorMsg}
          </div>
        )}

        {/* SUCCESS */}

        {status === "saved" && (
          <div className="admin-log-hours-success">
            Hours logged successfully.
          </div>
        )}

      </form>
    </div>
  );
}

export default AdminLogHoursForm;