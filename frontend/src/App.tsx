import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import {
  CalendarDays,
  LogOut,
  Menu,
  ChevronDown,
  ChevronLeft,
  Calendar as CalendarIcon,
  Briefcase,
  UserCog,
  Megaphone,
  Users,
  CreditCard,
  UserPlus,
  Headphones,
  BookUser,
  ClipboardList,
  FolderOpen,
  Package,
  ReceiptText,
  GraduationCap,
  RotateCcw,
} from "lucide-react";

// ─── Auth ────────────────────────────────────────────────────────────────────
import { AuthProvider, useAuth } from "./shared/auth/AuthContext";
import { LoginPage } from "./shared/auth/LoginPage";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";

// ─── Leave & Calendar ────────────────────────────────────────────────────────
import {
  LeaveDashboard,
  ManagerDashboard,
  HRDashboard,
  AdminDashboard,
} from "./modules/leave";
import { CalendarPage } from "./modules/calendar";

// ─── Other modules ───────────────────────────────────────────────────────────
import { AnnouncementsPage } from "./modules/announcements/AnnouncementsPage";
import { ComposeAnnouncementPage } from "./modules/announcements/ComposeAnnouncementPage";
import { AcknowledgmentsOverviewPage } from "./modules/announcements/AcknowledgmentsOverviewPage";
import { AnnouncementsDashboardPage } from "./modules/dashboard/AnnouncementsDashboardPage";
import UtilizationModulePage from "./modules/consultant_utilization/UtilizationModulePage";
import ExpenseClaimsModulePage from "./modules/expense_claims/ExpenseClaimsModulePage";
import RecruitingModulePage from "./modules/recruiting/RecruitingModulePage";
import { RecruitingHomePage } from "./modules/recruiting/RecruitingHomePage";
import { PipelineFunnelPage } from "./modules/recruiting/PipelineFunnelPage";
import { SourcingPage } from "./modules/recruiting/SourcingPage";
import { CandidatePipelinePage } from "./modules/recruiting/CandidatePipelinePage";
import { CandidateDetailPage } from "./modules/recruiting/CandidateDetailPage";
import TrainingModulePage from "./modules/training/TrainingModulePage";
import ProgramDetailsPage from "./modules/training/ProgramDetailsPage";
import { DuplicatesPage } from "./modules/recruiting/DuplicatesPage";
import HelpdeskModulePage from "./modules/helpdesk/HelpdeskModulePage";
import TicketDetailsPage from "./modules/helpdesk/TicketDetailsPage";
import { DirectoryPage } from "./modules/directory/DirectoryPage";
import { OnboardingPage } from "./modules/onboarding/OnboardingPage";
import { DocumentsPage } from "./modules/documents/DocumentsPage";

import Dashboard from "./modules/assets/pages/Dashboard";
import EmployeeDashboard from "./modules/assets/pages/EmployeeDashboard";
import { assetRoutes } from "./modules/assets/routes";
import { quoteRoutes } from "./modules/quotes/routes";

// ─── NavLink ─────────────────────────────────────────────────────────────────
const NavLink = ({
  to,
  icon: Icon,
  label,
  isSubItem = false,
}: {
  to: string;
  icon: any;
  label: string;
  isSubItem?: boolean;
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
   className={`group flex items-center justify-between rounded-lg font-semibold transition-all duration-200
    ${isSubItem ? "ml-6 text-[12.5px] px-3 py-2" : "text-[13px] px-3 py-2"}
    ${
      isSubItem
        ? isActive
          ? "bg-[#F37021] text-white shadow-sm shadow-[#F37021]/30"
          : "text-white hover:bg-white/10"
        : isActive
        ? "bg-white/10 text-white"
        : "text-white hover:bg-white/10"
    }`}
    >
      <div className="flex items-center space-x-3">
       <span
  className={`transition-colors duration-200 ${
    isActive
      ? "text-[#F37021]"
      : "text-white"
  }`}
>
          <Icon size={16} strokeWidth={2.25} />
        </span>

<span className="tracking-wide text-white">
          {label}
        </span>
      </div>
      {isActive && !isSubItem && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#F37021]" />
      )}
    </Link>
  );
};

// ─── Sidebar section label ───────────────────────────────────────────────────
const SectionLabel = ({ label }: { label: string }) => (
  <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold tracking-[0.14em] text-gray-500 uppercase select-none">
    {label}
  </p>
);

// ─── Authenticated layout ────────────────────────────────────────────────────
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [assetsOpen, setAssetsOpen] = useState(
  location.pathname.startsWith("/assets")
);

  const { employee, logout } = useAuth();

  // The actual database role of the logged-in user
  const actualRole = employee?.access_tier ?? "Employee";

  // State controls which view they are currently looking at
  const [activeRole, setActiveRole] = useState(actualRole);

  // Sync activeRole if employee details load slightly late
  useEffect(() => {
    if (employee?.access_tier) {
      setActiveRole(employee.access_tier);
    }
  }, [employee?.access_tier]);

  const displayName = employee?.name ?? "Admin User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const tierLabel = employee?.access_tier ?? "Administrator";

  const getHeaderTitle = () => {
    if (location.pathname.startsWith("/announcements")) return "Announcements";
    if (location.pathname.startsWith("/utilization")) return "Consultant Utilization";
    if (location.pathname.startsWith("/expenses")) return "Expense Claims";
    if (location.pathname.startsWith("/recruiting")) return "Recruiting";
    if (location.pathname.startsWith("/helpdesk")) return "Helpdesk";
    if (location.pathname.startsWith("/directory")) return "Directory";
    if (location.pathname.startsWith("/onboarding")) return "Onboarding";
    if (location.pathname.startsWith("/documents")) return "Documents";
    if (location.pathname.startsWith("/assets")) return "Assets";
    if (location.pathname.startsWith("/quotes")) return "Quotes";
    if (location.pathname.startsWith("/training")) return "Training";
    if (location.pathname === "/calendar") return "Company Calendar";
    if (location.pathname === "/dashboard") return "Announcements";
    if (location.pathname === "/" || location.pathname === "/dashboard") return "Leave Dashboard";
    return "UZVI Workspace";
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex h-screen bg-[#F4F6F8] font-sans overflow-hidden">
      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="w-[280px] bg-[#1A1614] flex flex-col justify-between shrink-0 transition-all border-r border-black/40">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#F37021] text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg shadow-[#F37021]/20">
              U
            </div>
            <div>
              <h1 className="font-extrabold text-white text-[15px] tracking-wide leading-tight">
                UZVI PORTAL
              </h1>
              <p className="text-[10.5px] text-[#F37021] font-bold tracking-[0.08em] uppercase">
                Employee Portal
              </p>
            </div>
          </div>
          <button className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <SectionLabel label="Workspace" />
          <div className="space-y-0.5">
            <NavLink to="/directory" icon={BookUser} label="Directory" />
            <NavLink to="/onboarding" icon={ClipboardList} label="Onboarding" />
            <NavLink to="/calendar" icon={CalendarDays} label="Company Calendar" />
            <NavLink to="/documents" icon={FolderOpen} label="Documents" />
          </div>

          <SectionLabel label="People" />
          <div className="space-y-0.5">
            <NavLink to="/" icon={Briefcase} label="Leave Management" />
            <NavLink to="/dashboard" icon={Megaphone} label="Announcements" />
            <NavLink to="/utilization" icon={Users} label="Consultant Utilization" />
            <NavLink to="/recruiting" icon={UserPlus} label="Recruiting" />
            <NavLink to="/training" icon={GraduationCap} label="Training" />
          </div>

          <SectionLabel label="Operations" />
          <div className="space-y-0.5">
            <div>

  {/* Parent Item */}
<div
  className={`flex items-center justify-between rounded-lg transition-all duration-200 ${
    location.pathname.startsWith("/assets")
      ? "bg-white/10 text-white"
      : "text-white hover:bg-white/10"
  }`}
>
    <Link
  to="/assets"
  className={`flex items-center gap-3 flex-1 px-3 py-2 text-[13px] font-semibold transition-colors ${
    location.pathname === "/assets"
      ? "text-white"
      : "text-white hover:text-white"
  }`}
>
     <Package
  size={16}
  strokeWidth={2.25}
  className={`transition-colors duration-200 ${
    location.pathname.startsWith("/assets")
      ? "text-[#F37021]"
      : "text-white"
  }`}
/>
      <span className="tracking-wide">Assets</span>
    </Link>

    {actualRole === "Admin/Leadership" && (
      <button
        type="button"
        onClick={() => setAssetsOpen(!assetsOpen)}
        className="px-3 py-2 text-gray-400 hover:text-white"
      >
        <ChevronDown
          size={15}
          className={`transition-transform duration-200 ${
            assetsOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
    )}
  </div>

  {/* Sub Menu */}
  {assetsOpen && actualRole === "Admin/Leadership" && (
    <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">

 <Link
  to="/assets/pending-returns"
  className={`flex items-center justify-between rounded-md px-3 py-2 text-[12.5px] font-medium transition-all duration-200 ${
    location.pathname === "/assets/pending-returns"
      ? "bg-white/10 text-white"
      : "text-white hover:bg-white/10"
  }`}
>
  <div className="flex items-center gap-2">
    <RotateCcw
      size={14}
      className={
        location.pathname === "/assets/pending-returns"
          ? "text-[#F37021]"
          : "text-white"
      }
    />
    <span className="text-white">Pending Returns</span>
  </div>

  {location.pathname === "/assets/pending-returns" && (
    <span className="w-1.5 h-1.5 rounded-full bg-[#F37021]" />
  )}
</Link>

    </div>
  )}

</div> 
            <NavLink to="/expenses" icon={CreditCard} label="Expense Claims" />
            <NavLink to="/helpdesk" icon={Headphones} label="Helpdesk" />
            <NavLink to="/quotes" icon={ReceiptText} label="Quotes" />
          </div>
        </div>

       
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-[72px] bg-[#1A1614] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition">
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {getHeaderTitle()}
            </h2>
          </div>

          <div className="flex items-center space-x-4">

            {/* CORRECTED: Role switcher only shows permitted options — restyled as a professional pill dropdown */}
            <div className="relative flex items-center space-x-2 bg-[#221D1A] border border-white/10 rounded-xl pl-3 pr-8 py-1.5 hover:border-white/20 hover:bg-white/[0.04] transition-colors duration-150 shadow-inner shadow-black/20">
              <UserCog size={15} className="text-[#F37021] shrink-0" />
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
                className="bg-transparent text-gray-200 text-[13px] font-semibold outline-none cursor-pointer appearance-none pr-1 tracking-wide"
              >
                {/* Rule: Employee only sees Employee Option */}
                {actualRole === "Employee" && (
                  <option value="Employee" className="bg-[#1A1614] text-white">Employee</option>
                )}

                {/* Rule: Manager sees Manager & Employee Options */}
                {actualRole === "Manager" && (
                  <>
                    <option value="Manager" className="bg-[#1A1614] text-white">Manager</option>
                    <option value="Employee" className="bg-[#1A1614] text-white">Employee</option>
                  </>
                )}

                {/* Rule: HR sees HR & Employee Options */}
                {actualRole === "HR" && (
                  <>
                    <option value="HR" className="bg-[#1A1614] text-white">HR</option>
                    <option value="Employee" className="bg-[#1A1614] text-white">Employee</option>
                  </>
                )}

                {/* Rule: Admin sees only Admin Option */}
                {actualRole === "Admin/Leadership" && (
                  <option value="Admin/Leadership" className="bg-[#1A1614] text-white">Admin/Leadership</option>
                )}

                {/* Fallback Option just in case it doesn't match standard roles */}
                {!["Employee", "Manager", "HR", "Admin/Leadership"].includes(actualRole) && (
                  <option value={actualRole} className="bg-[#1A1614] text-white">
                    {actualRole}
                  </option>
                )}
              </select>
              <ChevronDown
                size={13}
                className="text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>

            {/* Date */}
            <div className="hidden md:flex items-center space-x-2 border border-white/10 bg-[#221D1A] rounded-xl px-4 py-1.5 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/[0.04] hover:border-white/20 transition-colors duration-150">
              <CalendarIcon size={16} className="text-[#F37021]" />
              <span>{today}</span>
            </div>

            {/* Profile + Sign out */}
            <div className="flex items-center space-x-4 border-l border-white/10 pl-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#F37021] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {initials}
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-bold text-white leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                    {tierLabel}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
                className="border border-white/10 text-gray-300 hover:text-white rounded-xl px-3 py-1.5 flex items-center space-x-2 text-sm font-semibold hover:bg-white/5 transition"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route
              path="/"
              element={
                activeRole === "Manager" ? (
                  <div className="space-y-8">
                    <ManagerDashboard />
                    <hr className="border-gray-200 border-2 rounded-full" />
                    <LeaveDashboard />
                  </div>
                ) : activeRole === "HR" ? (
                  <div className="space-y-8">
                    <HRDashboard />
                    <hr className="border-gray-200 border-2 rounded-full" />
                    <LeaveDashboard />
                  </div>
                ) : activeRole === "Admin" ? (
                  <AdminDashboard />
                ) : (
                  <LeaveDashboard />
                )
              }
            />

            <Route
              path="/calendar"
              element={<CalendarPage role={activeRole} />}
            />

            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/new"
              element={
                <ProtectedRoute>
                  <ComposeAnnouncementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/acknowledgments"
              element={
                <ProtectedRoute>
                  <AcknowledgmentsOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AnnouncementsDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/utilization"
              element={
                <ProtectedRoute>
                  <UtilizationModulePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpenseClaimsModulePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recruiting"
              element={
                <ProtectedRoute>
                  <RecruitingModulePage />
                </ProtectedRoute>
              }
            >
              <Route index element={<RecruitingHomePage />} />
              <Route path="funnel" element={<PipelineFunnelPage />} />
              <Route path="sourcing" element={<SourcingPage />} />
              <Route path="pipeline" element={<CandidatePipelinePage />} />
              <Route path="duplicates" element={<DuplicatesPage />} />
              <Route
                path="candidates/:candidateId"
                element={<CandidateDetailPage />}
              />
            </Route>

            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute>
                  <HelpdeskModulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/tickets/:ticketId"
              element={
                <ProtectedRoute>
                  <TicketDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/directory"
              element={
                <ProtectedRoute>
                  <DirectoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="candidates/:candidateId"
              element={<CandidateDetailPage />}
            />

            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/training"
              element={
                <ProtectedRoute>
                  <TrainingModulePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/training/programs/:programId"
              element={
                <ProtectedRoute>
                  <ProgramDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  {activeRole === "Employee" ? (
                    <EmployeeDashboard />
                  ) : (
                    <Dashboard />
                  )}
                </ProtectedRoute>
              }
            />

            {quoteRoutes}
            {assetRoutes}

            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                  <span className="text-4xl mb-4">🚧</span>
                  <h3 className="text-lg font-bold text-gray-800">
                    Module Under Construction
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    This section is outside the scope of our current focus.
                  </p>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ─── Gate: show login or app ─────────────────────────────────────────────────
function AuthGate() {
  const { employee, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1614] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#F37021] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Public route
  if (location.pathname === "/login") {
    return <LoginPage />;
  }

  // Not logged in → force login
  if (!employee) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppLayout />;
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AuthGate />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}