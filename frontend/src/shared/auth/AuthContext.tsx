import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchEmployee, type Employee } from "./api";

interface AuthContextValue {
  employee: Employee | null;
  isLoading: boolean;
  login: (employeeId: string) => Promise<Employee>;
  logout: () => void;
  deactivatedMessage: string | null;
  clearDeactivatedMessage: () => void;
  roleChangedMessage: string | null;
  clearRoleChangedMessage: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "uzvi_portal_employee_id";

const REVALIDATE_INTERVAL_MS = 10000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deactivatedMessage, setDeactivatedMessage] = useState<string | null>(null);
  const [roleChangedMessage, setRoleChangedMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setIsLoading(false);
      return;
    }
    fetchEmployee(storedId)
      .then(setEmployee)
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!employee) return;
    const intervalId = setInterval(() => {
      fetchEmployee(employee.employee_id)
        .then((fresh) => {
          setEmployee((prev) => {
            if (prev && prev.access_tier !== fresh.access_tier) {
              setRoleChangedMessage(
                `Your access tier changed to ${fresh.access_tier}. The page has been updated to match.`
              );
            }
            return fresh;
          });
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          setEmployee(null);
          setDeactivatedMessage("Your account is no longer active. Please contact an Admin or HR.");
        });
    }, REVALIDATE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [employee]);

  async function login(employeeId: string) {
    const emp = await fetchEmployee(employeeId);
    localStorage.setItem(STORAGE_KEY, emp.employee_id);
    setEmployee(emp);
    return emp;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setEmployee(null);
  }

  function clearDeactivatedMessage() {
    setDeactivatedMessage(null);
  }

  function clearRoleChangedMessage() {
    setRoleChangedMessage(null);
  }

  return (
    <AuthContext.Provider
      value={{
        employee,
        isLoading,
        login,
        logout,
        deactivatedMessage,
        clearDeactivatedMessage,
        roleChangedMessage,
        clearRoleChangedMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}