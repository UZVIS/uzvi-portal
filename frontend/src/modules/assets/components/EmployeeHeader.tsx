import { LogOut, Menu } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import "../styles/dashboard.css";

export default function EmployeeHeader() {

  const navigate = useNavigate();
  const { employee, logout } = useAuth();
  function handleLogout() {

    // Later replace this with your authentication logout
    navigate("/login");

  }

  return (

    <header className="dashboard-header">

      <div className="header-left">

        <button className="menu-btn">

          <Menu size={20} />

        </button>

        <h2>My Assets</h2>

      </div>

      <div className="header-right">

        <div className="profile">

          <div className="profile-avatar">
            EU
          </div>

          <div className="profile-text">

            <strong>{employee?.name}</strong>

            <small>Employee</small>

          </div>

        </div>

        <button
          className="logout-inline-btn"
          onClick={handleLogout}
        >

          <LogOut size={16} />

          <span>Sign out</span>

        </button>

      </div>

    </header>

  );

}
