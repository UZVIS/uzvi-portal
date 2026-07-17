import {
  LayoutDashboard,
  Laptop,
  UserCheck,
  ClipboardList,
  RotateCcw,
  FileBarChart2,
  Wrench,
  Settings,
  Database,
  ChevronDown
} from "lucide-react";

import "../styles/sidebar.css";

const menu = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    active: true,
  },
  {
    icon: Laptop,
    label: "Assets",
  },
  {
    icon: UserCheck,
    label: "Assign Asset",
  },
  {
    icon: ClipboardList,
    label: "Asset Requests",
  },
  {
    icon: RotateCcw,
    label: "Returns",
  },
  {
    icon: FileBarChart2,
    label: "Inventory Report",
  },
  {
    icon: Wrench,
    label: "Maintenance",
  },
  {
    icon: Settings,
    label: "Settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar-logo">

        <div className="logo-circle">
          <Database size={24} />
        </div>

        <div>
          <h2>UZVI PORTAL</h2>
          <span>Asset Management</span>
        </div>

      </div>

      <nav className="sidebar-menu">

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`menu-item ${item.active ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}

      </nav>

      <div className="sidebar-user">

        <div className="avatar">
          AU
        </div>

        <div className="user-info">
          <strong>Admin User</strong>
          <small>Administrator</small>
        </div>

        <ChevronDown size={16} />

      </div>

    </aside>
  );
}