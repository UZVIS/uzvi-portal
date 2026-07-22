import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";
import EmployeeAssetTable from "../components/EmployeeAssetTable";

import { useAuth } from "../../../shared/auth/AuthContext";

export default function EmployeeDashboard() {

    const { employee } = useAuth();

    if (!employee) {
        return <div>Loading...</div>;
    }

    return (

        <div className="dashboard-layout">

            <EmployeeSidebar />

            <div className="dashboard-page">

                <EmployeeHeader />

                <main className="dashboard-body">

                    <EmployeeAssetTable
                        employeeId={employee.employee_id}
                    />

                </main>

            </div>

        </div>

    );

}