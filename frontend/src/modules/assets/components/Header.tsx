import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
} from "lucide-react";

import "../styles/dashboard.css";

export default function Header() {
  return (
    <header className="dashboard-header">

      <div className="header-left">
        <button className="menu-btn">
          <Menu size={20} />
        </button>

        <h2>Dashboard</h2>
      </div>

      <div className="header-right">

        <button className="date-picker">
          <CalendarDays size={18} />
          <span>15 Jul 2026</span>
          <ChevronDown size={16} />
        </button>

        {/* <button className="notification">
          <Bell size={19} />

          <span className="notification-dot">
            8
          </span>
        </button> */}

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