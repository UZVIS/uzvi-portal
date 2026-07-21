import { useState } from "react";

import {
  ChevronDown,
  ChevronRight,
  Boxes,
  LayoutDashboard,
  RotateCcw,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

import "../styles/sidebar.css";

interface SidebarProps {
  pendingReturnsCount?: number;
}

interface SubItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  badgeKey?: string;
}

interface FlatItem {
  type: "item";
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

interface MenuGroup {
  type: "group";
  icon: typeof Boxes;
  label: string;
  path: string;
  children: SubItem[];
}

type MenuEntry = FlatItem | MenuGroup;

const menu: MenuEntry[] = [
  {
    type: "item",
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    type: "group",
    icon: Boxes,
    label: "Assets",
    path: "/assets",
    children: [
      {
        icon: RotateCcw,
        label: "Pending Returns",
        path: "/assets/pending-returns",
        badgeKey: "pendingReturns",
      },
    ],
  },
];

export default function Sidebar({ pendingReturnsCount = 0 }: SidebarProps) {
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menu.forEach((entry) => {
      if (entry.type === "group") {
        initial[entry.label] = location.pathname.startsWith(entry.path);
      }
    });
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

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

        {menu.map((entry) => {

          if (entry.type === "item") {

            const ItemIcon = entry.icon;

            return (

              <NavLink
                key={entry.label}
                to={entry.path}
                className={({ isActive }) =>
                  `menu-item ${isActive ? "active" : ""}`
                }
              >

                <ItemIcon size={18} />

                <span>{entry.label}</span>

              </NavLink>

            );

          }

          const group = entry;
          const GroupIcon = group.icon;
          const isOpen = openGroups[group.label];
          const isGroupActive = location.pathname.startsWith(group.path);

          return (

            <div key={group.label} className="menu-group">

              <div
                className={`menu-item menu-group-header ${
                  isGroupActive ? "active" : ""
                }`}
              >

                <NavLink to={group.path} end className="menu-group-link">

                  <GroupIcon size={18} />

                  <span>{group.label}</span>

                </NavLink>

                <button
                  type="button"
                  className="menu-chevron-btn"
                  aria-label={
                    isOpen ? `Collapse ${group.label}` : `Expand ${group.label}`
                  }
                  onClick={() => toggleGroup(group.label)}
                >

                  {isOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}

                </button>

              </div>

              {isOpen && (

                <div className="menu-subgroup">

                  {group.children.map((item) => {

                    const Icon = item.icon;

                    const badgeCount =
                      item.badgeKey === "pendingReturns"
                        ? pendingReturnsCount
                        : 0;

                    return (

                      <NavLink
                        key={item.label}
                        to={item.path}
                        className={({ isActive }) =>
                          `menu-item menu-subitem ${isActive ? "active" : ""}`
                        }
                      >

                        <Icon size={16} />

                        <span>{item.label}</span>

                        {badgeCount > 0 && (
                          <span className="menu-badge">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}

                      </NavLink>

                    );

                  })}

                </div>

              )}

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
