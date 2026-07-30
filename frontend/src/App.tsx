import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
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
import { assetRoutes } from "./modules/assets/routes";
import { quoteRoutes } from "./modules/quotes/routes";
import PendingReturnsPage from "./modules/assets/pages/pendingReturnsPage";
import EmployeeDashboard from "./modules/assets/pages/EmployeeDashboard";
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
      className={`flex items-center justify-between px-3 py-2 mb-0.5 rounded-lg font-semibold transition-all duration-200 
                ${isSubItem ? "ml-6 text-sm py-1.5" : "text-[13px]"} 
                ${
                  isActive
                    ? "bg-[#F37021] text-white shadow-md"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
    >
      <div className="flex items-center space-x-3">
        <span className={isActive ? "text-white" : "text-gray-500"}>
          <Icon size={16} strokeWidth={2.5} />
        </span>
        <span>{label}</span>
      </div>
      {isActive && !isSubItem && (
        <ChevronDown size={16} className="text-white" />
      )}
    </Link>
  );
};

// ─── Authenticated layout ────────────────────────────────────────────────────
function AppLayout() {
  const [activeRole, setActiveRole] = useState("Employee");
  const location = useLocation();
  const navigate = useNavigate();
  const { employee, logout } = useAuth();

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
    if (location.pathname.startsWith("/utilization"))
      return "Consultant Utilization";
    if (location.pathname.startsWith("/expenses")) return "Expense Claims";
    if (location.pathname.startsWith("/recruiting")) return "Recruiting";
    if (location.pathname.startsWith("/helpdesk")) return "Helpdesk";
    if (location.pathname.startsWith("/directory")) return "Directory";
    if (location.pathname.startsWith("/onboarding")) return "Onboarding";
    if (location.pathname.startsWith("/documents")) return "Documents";
    if (location.pathname === "/calendar") return "Company Calendar";
    if (location.pathname === "/dashboard") return "Announcements";
    if (location.pathname === "/") return "Leave Dashboard";
    return "UZVI Workspace";
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex h-screen bg-[#F4F6F8] font-sans overflow-hidden">
      {/* ─── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="w-[280px] bg-[#1A1614] flex flex-col justify-between shrink-0 transition-all">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#F37021] text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg">
              U
            </div>
            <div>
              <h1 className="font-extrabold text-white text-[15px] tracking-wide leading-tight">
                UZVI PORTAL
              </h1>
              <p className="text-[11px] text-[#F37021] font-bold tracking-wide">
                Employee Portal
              </p>
            </div>
          </div>
          <button className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden px-3 py-3">
          <div className="mb-0.5">
            <NavLink to="/" icon={Briefcase} label="Leave Management" />
          </div>
          <div className="mb-0.5">
            <NavLink to="/calendar" icon={CalendarDays} label="Company Calendar" />
          </div>
          <div className="mb-0.5">
            <NavLink to="/dashboard" icon={Megaphone} label="Announcements" />
          </div>
          <div className="mb-0.5">
            <NavLink
              to="/utilization"
              icon={Users}
              label="Consultant Utilization"
            />
          </div>
          <div className="mb-0.5">
            <NavLink to="/expenses" icon={CreditCard} label="Expense Claims" />
          </div>
          <div className="mb-0.5">
            <NavLink to="/recruiting" icon={UserPlus} label="Recruiting" />
          </div>
          <div className="mb-0.5">
            <NavLink to="/helpdesk" icon={Headphones} label="Helpdesk" />
          </div>
          <div className="mb-0.5">
            <NavLink to="/directory" icon={BookUser} label="Directory" />
          </div>
          <div className="mb-0.5">
            <NavLink to="/onboarding" icon={ClipboardList} label="Onboarding" />
          </div>
          <div className="mb-0.5">
            <NavLink to="/documents" icon={FolderOpen} label="Documents" />
          </div>
        </div>

        {/* Bottom user card */}
        <div className="px-3 py-2.5 border-t border-white/5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F37021] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-[#F37021] font-semibold">
                {tierLabel}
              </p>
            </div>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
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
            {/* Role switcher */}
            <div className="flex items-center space-x-2 bg-[#2A2421] border border-white/10 rounded-xl px-3 py-1.5 hover:bg-white/5 transition">
              <UserCog size={16} className="text-[#F37021]" />
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
                className="bg-transparent text-gray-300 text-sm font-semibold outline-none cursor-pointer appearance-none pr-3"
              >
                <option value="Employee" className="bg-[#1A1614] text-white">
                  Employee
                </option>
                <option value="Manager" className="bg-[#1A1614] text-white">
                  Manager
                </option>
                <option value="HR" className="bg-[#1A1614] text-white">
                  HR
                </option>
                <option value="Admin" className="bg-[#1A1614] text-white">
                  Admin
                </option>
              </select>
              <ChevronDown
                size={14}
                className="text-gray-500 -ml-2 pointer-events-none"
              />
            </div>

            {/* Date */}
            <div className="hidden md:flex items-center space-x-2 border border-white/10 bg-[#2A2421] rounded-xl px-4 py-1.5 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition">
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
                  <p className="text-[10px] text-gray-400 font-medium">
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
                activeRole === "Employee" ? (
                  <LeaveDashboard />
                ) : activeRole === "Manager" ? (
                  <ManagerDashboard />
                ) : activeRole === "Admin" ? (
                  <AdminDashboard />
                ) : activeRole === "HR" ? (
                  <HRDashboard />
                ) : null
              }
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
    path="/assets/pending-returns"
    element={<PendingReturnsPage />}
/>
     
      <Route
    path="/employee-dashboard"
    element={<EmployeeDashboard />}
/>

          {assetRoutes}
          {quoteRoutes}

          {allModules
            .filter((module) => module.prefix !== "/announcements" &&
             module.prefix !== "/assets" &&
             module.prefix !== "/quotes"
)
            .map((module) => (
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
            path="/helpdesk/tickets/:ticketId"
            element={
              <ProtectedRoute>
                <TicketDetailsPage />
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
            path="/directory"
            element={
              <ProtectedRoute>
                <DirectoryPage />
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
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />

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
        
      </BrowserRouter>
      </Router>
    </AuthProvider>
  );
}