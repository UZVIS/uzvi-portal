// src/modules/performance/components/OrgReviewStatus.tsx
 
import React, {
  useEffect,
  useState,
} from "react";
 
// Use the shared, authenticated axios instance (sends X-Employee-Id) and
// the existing cycle-lookup helpers instead of a bare axios.get with no
// auth header and a hardcoded cycle_id=1.
import api, { getActiveCycle, getCycles } from "../services/performanceService";
 
interface EmployeeStatus {
 
  employee_id: string;
 
  employee_name: string;
 
  goals_count: number;
 
  status: string;
 
  self_assessment_submitted: boolean;
 
  manager_review_completed: boolean;
 
  completion_percentage: number;
 
}
 
interface OrgStatus {
 
  cycle_id: number;
 
  cycle_name: string;
 
  employees: EmployeeStatus[];
 
  total_employees: number;
 
  completed_count: number;
 
  pending_self_assessment_count: number;
 
  pending_manager_review_count: number;
 
}
 
const OrgReviewStatus: React.FC = () => {
 
  const [data, setData] =
    useState<OrgStatus | null>(null);
 
  const [loading, setLoading] =
    useState(true);
 
  const [error, setError] =
    useState("");
 
  useEffect(() => {
 
    loadStatus();
 
  }, []);
 
  const loadStatus = async () => {
 
    try {
 
      setLoading(true);
      setError("");
 
      // There's no single "current" cycle_id to hardcode - resolve the
      // actual active cycle first, and fall back to the most recent cycle
      // if none is currently active (e.g. between cycles).
      const active = await getActiveCycle();
      let cycleId = active?.id;
 
      if (!cycleId) {
        const cycles = await getCycles();
        cycleId = cycles[0]?.id;
      }
 
      if (!cycleId) {
        setData(null);
        setError(
          "No review cycles exist yet. Create one under \u201cCreate Review Cycle\u201d first."
        );
        return;
      }
 
      const response =
        await api.get(
          `/status/org?cycle_id=${cycleId}`
        );
 
      setData(response.data);
 
    } catch (err) {
 
      console.error(err);
 
      setError(
        "Unable to load organization review status."
      );
 
    } finally {
 
      setLoading(false);
 
    }
 
  };
 
  if (loading) {
 
    return (
 
      <div className="flex justify-center items-center h-60">
 
        <h2 className="text-lg font-semibold">
 
          Loading...
 
        </h2>
 
      </div>
 
    );
 
  }
 
  if (error) {
 
    return (
 
      <div className="bg-red-100 border border-red-300 rounded-xl p-6">
 
        {error}
 
      </div>
 
    );
 
  }
 
  return (
 
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
 
      <h2 className="text-3xl font-bold text-gray-800">
 
        Organization Review Status
 
      </h2>
 
      <p className="text-gray-500 mt-2">
 
        Organization Performance Review Summary
 
      </p>
 
      <div className="grid grid-cols-4 gap-5 mt-8">
 
                <div className="bg-blue-50 rounded-xl p-5 border">
 
          <h4 className="text-sm text-gray-500">
 
            Total Employees
 
          </h4>
 
          <h2 className="text-3xl font-bold mt-2">
 
            {data?.total_employees}
 
          </h2>
 
        </div>
 
        <div className="bg-green-50 rounded-xl p-5 border">
 
          <h4 className="text-sm text-gray-500">
 
            Completed Reviews
 
          </h4>
 
          <h2 className="text-3xl font-bold mt-2 text-green-600">
 
            {data?.completed_count}
 
          </h2>
 
        </div>
 
        <div className="bg-yellow-50 rounded-xl p-5 border">
 
          <h4 className="text-sm text-gray-500">
 
            Pending Self Assessment
 
          </h4>
 
          <h2 className="text-3xl font-bold mt-2 text-yellow-600">
 
            {data?.pending_self_assessment_count}
 
          </h2>
 
        </div>
 
        <div className="bg-red-50 rounded-xl p-5 border">
 
          <h4 className="text-sm text-gray-500">
 
            Pending Manager Review
 
          </h4>
 
          <h2 className="text-3xl font-bold mt-2 text-red-600">
 
            {data?.pending_manager_review_count}
 
          </h2>
 
        </div>
 
      </div>
 
      <div className="overflow-x-auto mt-10">
 
        <table className="min-w-full border rounded-xl overflow-hidden">
 
          <thead className="bg-orange-500 text-white">
 
            <tr>
 
              <th className="px-4 py-3 text-left">
 
                Employee
 
              </th>
 
              <th className="px-4 py-3 text-left">
 
                Goals
 
              </th>
 
              <th className="px-4 py-3 text-left">
 
                Status
 
              </th>
 
              <th className="px-4 py-3 text-left">
 
                Self Assessment
 
              </th>
 
              <th className="px-4 py-3 text-left">
 
                Manager Review
 
              </th>
 
              <th className="px-4 py-3 text-left">
 
                Completion %
 
              </th>
 
            </tr>
 
          </thead>
 
          <tbody>
 
            {
 
              data?.employees.map((employee) => (
 
                <tr
                  key={employee.employee_id}
                  className="border-b hover:bg-gray-50"
                >
 
                  <td className="px-4 py-4">
 
                    {employee.employee_name}
 
                  </td>
 
                  <td className="px-4 py-4">
 
                    {employee.goals_count}
 
                  </td>
 
                  <td className="px-4 py-4">
 
                    {employee.status.replaceAll("_", " ")}
 
                  </td>
 
                  <td className="px-4 py-4">
 
                    {
 
                      employee.self_assessment_submitted
 
                        ? "Yes"
 
                        : "No"
 
                    }
 
                  </td>
 
                  <td className="px-4 py-4">
 
                    {
 
                      employee.manager_review_completed
 
                        ? "Completed"
 
                        : "Pending"
 
                    }
 
                  </td>
 
                  <td className="px-4 py-4">
 
                    {employee.completion_percentage}%
 
                  </td>
 
                </tr>
 
              ))
 
            }
 
          </tbody>
 
        </table>
 
      </div>
 
          </div>
 
  );
 
};
 
export default OrgReviewStatus;