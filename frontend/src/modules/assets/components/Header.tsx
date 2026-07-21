import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

import "../styles/dashboard.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDisplayDate(date: Date) {
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarDays(viewYear: number, viewMonth: number) {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; inCurrentMonth: boolean; date: Date }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({
      day,
      inCurrentMonth: false,
      date: new Date(viewYear, viewMonth - 1, day),
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      inCurrentMonth: true,
      date: new Date(viewYear, viewMonth, day),
    });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const nextDay = cells.length - (startOffset + daysInMonth) + 1;
    cells.push({
      day: nextDay,
      inCurrentMonth: false,
      date: new Date(viewYear, viewMonth + 1, nextDay),
    });
    if (cells.length >= 42) break;
  }

  return cells;
}

export default function Header() {
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openCalendar() {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
    setIsCalendarOpen((prev) => !prev);
  }

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSelectDay(date: Date) {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  }

  const calendarDays = getCalendarDays(viewYear, viewMonth);

  return (
    <header className="dashboard-header">

      <div className="header-left">
        <button className="menu-btn">
          <Menu size={20} />
        </button>

        <h2>Dashboard</h2>
      </div>

      <div className="header-right">

        <div className="date-picker-wrap" ref={calendarRef}>

          <button
            className={`date-picker ${isCalendarOpen ? "active" : ""}`}
            onClick={openCalendar}
            type="button"
          >
            <CalendarDays size={18} />
            <span>{formatDisplayDate(selectedDate)}</span>
            <ChevronDown
              size={16}
              className={`date-picker-chevron ${isCalendarOpen ? "flipped" : ""}`}
            />
          </button>

          {isCalendarOpen && (

            <div className="calendar-popover">

              <div className="calendar-popover-header">

                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={goToPrevMonth}
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="calendar-month-label">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>

                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={goToNextMonth}
                >
                  <ChevronRight size={16} />
                </button>

              </div>

              <div className="calendar-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="calendar-grid">
                {calendarDays.map((cell, index) => {

                  const isToday = isSameDay(cell.date, today);
                  const isSelected = isSameDay(cell.date, selectedDate);

                  return (
                    <button
                      type="button"
                      key={index}
                      className={[
                        "calendar-day",
                        !cell.inCurrentMonth ? "muted" : "",
                        isToday ? "today" : "",
                        isSelected ? "selected" : "",
                      ].join(" ").trim()}
                      onClick={() => handleSelectDay(cell.date)}
                    >
                      {cell.day}
                    </button>
                  );

                })}
              </div>

              <div className="calendar-popover-footer">
                <button
                  type="button"
                  className="calendar-today-btn"
                  onClick={() => handleSelectDay(today)}
                >
                  Today
                </button>
              </div>

            </div>

          )}

        </div>

        <div className="profile">

          <div className="profile-avatar">
            AU
          </div>

          <div className="profile-text">
            <strong>Admin User</strong>
            <small>Administrator</small>
          </div>

          <ChevronDown size={18} />

        </div>

      </div>

    </header>
  );
}
