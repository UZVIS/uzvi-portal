import { ChevronDown, Package } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import "../styles/sidebar.css";

export default function EmployeeSidebar() {
  const { employee, logout } = useAuth();
  return (
    <aside className="sidebar">

      <div className="sidebar-logo">

        <div className="avatar">
          U
        </div>

        <div>
          <h2>UZVI PORTAL</h2>
          <span>Asset Management</span>
        </div>

      </div>

      <nav className="sidebar-menu">

        <NavLink
          to="/employee-dashboard"
          className={({ isActive }) =>
            `menu-item ${isActive ? "active" : ""}`
          }
        >
          <Package size={18} />
          <span>My Assets</span>
        </NavLink>

      </nav>

      <div className="sidebar-user">

        <div className="avatar">
          EU
        </div>

        <div className="user-info">
         <strong>{employee?.name}</strong>
          <small>Employee</small>
        </div>

        <ChevronDown size={16} />

      </div>

    </aside>
  );
}