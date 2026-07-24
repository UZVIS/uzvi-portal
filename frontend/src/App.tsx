import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { useState } from "react";
// 🌟 Premium Icons
import { LayoutDashboard, CalendarDays, LogOut, Menu, ChevronDown, ChevronLeft, Calendar as CalendarIcon, Briefcase, UserCog } from "lucide-react";

import { LeaveDashboard, ManagerDashboard, HRDashboard, AdminDashboard } from "./modules/leave";
import { CalendarPage } from "./modules/calendar";

const NavLink = ({ to, icon: Icon, label, isSubItem = false }: { to: string, icon: any, label: string, isSubItem?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-4 py-3 mb-1 rounded-xl font-semibold transition-all duration-200 
                ${isSubItem ? 'ml-6 text-sm py-2' : 'text-[15px]'} 
                ${isActive
          ? 'bg-[#F37021] text-white shadow-md'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <div className="flex items-center space-x-3">
        <span className={`${isActive ? 'text-white' : 'text-gray-500'}`}>
          <Icon size={18} strokeWidth={2.5} />
        </span>
        <span>{label}</span>
      </div>
      {isActive && !isSubItem && <ChevronDown size={16} className="text-white" />}
    </Link>
  );
};

function AppLayout() {
  const [activeRole, setActiveRole] = useState("Employee");

  return (
    <div className="flex h-screen bg-[#F4F6F8] font-sans overflow-hidden">

      {/* 🌟 1. PREMIUM DARK SIDEBAR */}
      <aside className="w-[280px] bg-[#1A1614] flex flex-col justify-between shrink-0 transition-all">
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F37021] text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg">
              U
            </div>
            <div>
              <h1 className="font-extrabold text-white text-[15px] tracking-wide leading-tight">UZVI PORTAL</h1>
              <p className="text-[11px] text-[#F37021] font-bold tracking-wide">Leave & Calendar</p>
            </div>
          </div>
          <button className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <div className="mb-6">
            <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          </div>

          <div className="mb-2">
            <NavLink to="/" icon={Briefcase} label="Leave Management" />
          </div>

          <div className="mt-4">
            <NavLink to="/calendar" icon={CalendarDays} label="Company Calendar" />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F37021] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              AU
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Admin User</p>
              <p className="text-[11px] text-[#F37021] font-semibold">Administrator</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </aside>

      {/* 🌟 2. MAIN CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* 🌟 3. HEADER */}
        <header className="h-[72px] bg-[#1A1614] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition">
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-bold text-white tracking-wide">
              <Routes>
                <Route path="/" element="Leave Dashboard" />
                <Route path="/calendar" element="Company Calendar" />
                <Route path="*" element="UZVI Workspace" />
              </Routes>
            </h2>
          </div>

          <div className="flex items-center space-x-4">

            {/* 🛠️ ROLE SWITCHER (నీకు కావాల్సిన విధంగా హెడర్ లోకి తెచ్చాను) */}
            <div className="flex items-center space-x-2 bg-[#2A2421] border border-white/10 rounded-xl px-3 py-1.5 hover:bg-white/5 transition">
              <UserCog size={16} className="text-[#F37021]" />
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
                className="bg-transparent text-gray-300 text-sm font-semibold outline-none cursor-pointer appearance-none pr-3"
              >
                <option value="Employee" className="bg-[#1A1614] text-white">Employee</option>
                <option value="Manager" className="bg-[#1A1614] text-white">Manager</option>
                <option value="HR" className="bg-[#1A1614] text-white">HR</option>
                <option value="Admin" className="bg-[#1A1614] text-white">Admin</option>
              </select>
              <ChevronDown size={14} className="text-gray-500 -ml-2 pointer-events-none" />
            </div>

            {/* Date Widget */}
            <div className="hidden md:flex items-center space-x-2 border border-white/10 bg-[#2A2421] rounded-xl px-4 py-1.5 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition">
              <CalendarIcon size={16} className="text-[#F37021]" />
              <span>22 Jul 2026</span>
            </div>

            {/* Top Right Profile */}
            <div className="flex items-center space-x-4 border-l border-white/10 pl-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#F37021] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  AU
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-bold text-white leading-tight">Admin User</p>
                  <p className="text-[10px] text-gray-400 font-medium">Administrator</p>
                </div>
              </div>

              <button className="border border-white/10 text-gray-300 hover:text-white rounded-xl px-3 py-1.5 flex items-center space-x-2 text-sm font-semibold hover:bg-white/5 transition">
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* 🌟 4. DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={
              activeRole === "Employee" ? <LeaveDashboard /> :
                activeRole === "Manager" ? <ManagerDashboard /> :
                  activeRole === "Admin" ? <AdminDashboard /> :
                    activeRole === "HR" ? <HRDashboard /> : null
            } />
            <Route path="/calendar" element={<CalendarPage role={activeRole} />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <span className="text-4xl mb-4">🚧</span>
                <h3 className="text-lg font-bold text-gray-800">Module Under Construction</h3>
                <p className="text-sm text-gray-500 mt-2">This section is outside the scope of our current focus.</p>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}