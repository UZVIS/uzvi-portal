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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "uzvi_portal_employee_id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ employee, isLoading, login, logout }}>
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