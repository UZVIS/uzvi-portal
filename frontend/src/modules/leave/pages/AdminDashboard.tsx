import { useState, useEffect } from "react";
import { useAuth } from "../../../shared/auth/AuthContext";
import { apiGet } from "../../../api/client";
import { Lightbulb, Activity, Settings2, Wallet } from "lucide-react";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'tracker' | 'config' | 'balances'>('tracker');

    const [allLeaves, setAllLeaves] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { employee } = useAuth();
    const adminId = employee?.employee_id;

    // Timezone-safe Working Days Calculation (Skipping Sat, Sun & Holidays)
    const getDurationNumber = (start: string, end: string) => {
        if (!start || !end) return 0;

        const [sYear, sMonth, sDay] = start.split('-').map(Number);
        const [eYear, eMonth, eDay] = end.split('-').map(Number);

        let currDate = new Date(sYear, sMonth - 1, sDay);
        const endDateObj = new Date(eYear, eMonth - 1, eDay);

        if (currDate > endDateObj) return 0;

        let workingDays = 0;
        while (currDate <= endDateObj) {
            const dayOfWeek = currDate.getDay();
            const yyyy = currDate.getFullYear();
            const mm = String(currDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currDate.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;

            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isHoliday = holidays.includes(formattedDate);

            if (!isWeekend && !isHoliday) {
                workingDays++;
            }
            currDate.setDate(currDate.getDate() + 1);
        }
        return workingDays;
    };

    const getDurationDays = (start: string, end: string) => {
        const days = getDurationNumber(start, end);
        if (days <= 0) return 0;
        return days;
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const typesData = await apiGet('/v1/leave/leave-types');
            const validTypes = Array.isArray(typesData) ? typesData : [];
            setLeaveTypes(validTypes);

            const appsData = await apiGet('/v1/leave/applications?role=Admin');
            setAllLeaves(Array.isArray(appsData) ? appsData : []);

            try {
                const holidaysData = await apiGet('/v1/calendar/holidays');
                if (Array.isArray(holidaysData)) {
                    const hDates = holidaysData.map((h: any) => {
                        if (typeof h.date === 'string') return h.date.split('T')[0];
                        return new Date(h.date).toISOString().split('T')[0];
                    });
                    setHolidays(hDates);
                }
            } catch (calErr) {
                console.error("Error fetching holidays:", calErr);
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getLeaveName = (id: string) => {
        const type = (leaveTypes || []).find(t => t?.leave_type_id === id);
        return type ? type.name : "Unknown Leave";
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const handleAction = async (applicationId: string, actionType: 'APPROVED' | 'REJECTED') => {
        if (!adminId) return;

        try {
            const payload = {
                status: actionType,
                approver_id: adminId
            };

            // Using the base URL configured in your API client instead of hardcoding localhost
            const response = await fetch(`http://127.0.0.1:8000/api/v1/leave/applications/${applicationId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchAdminData();
            } else {
                const err = await response.json();
                console.error(`Failed to update status:`, err.detail || err);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">Admin Control Center</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage org-wide leaves, policies, and employee balances.</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('tracker')} className={`px-4 py-2 text-sm font-bold rounded-md transition flex items-center space-x-2 ${activeTab === 'tracker' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Activity size={16} /> <span>Tracker</span>
                    </button>
                    <button onClick={() => setActiveTab('config')} className={`px-4 py-2 text-sm font-bold rounded-md transition flex items-center space-x-2 ${activeTab === 'config' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Settings2 size={16} /> <span>Configurations</span>
                    </button>
                    <button onClick={() => setActiveTab('balances')} className={`px-4 py-2 text-sm font-bold rounded-md transition flex items-center space-x-2 ${activeTab === 'balances' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Wallet size={16} /> <span>Balances</span>
                    </button>
                </div>
            </div>

            {isLoading && <div className="text-center py-10 text-gray-500 font-bold">Loading Data...</div>}

            {/* TAB 1: Global Leave Tracker */}
            {!isLoading && activeTab === 'tracker' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Global Leave Activity</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-gray-100">
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Employee</th>
                                    <th className="py-4 px-6">Leave Details</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allLeaves.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-gray-500">No leave applications found.</td></tr>
                                ) : (
                                    allLeaves.map((leave) => {
                                        const currentStatus = leave.status?.toUpperCase() || "";
                                        const isPendingAction = currentStatus === "PENDING" || currentStatus === "PENDING_HR";
                                        const daysCount = getDurationDays(leave.start_date, leave.end_date);

                                        // PHASE 1: Using the joined employee data from backend
                                        const empName = leave.employee?.name || (leave.employee?.first_name ? `${leave.employee.first_name} ${leave.employee.last_name || ''}`.trim() : null) || leave.employee_id;
                                        const teamId = leave.employee?.team_id || "Unassigned";

                                        return (
                                            <tr key={leave.application_id} className="hover:bg-gray-50 transition">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-gray-900">{empName}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        ID: <span className="font-semibold text-gray-600">{leave.employee_id}</span> • Team: {teamId}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-bold text-sm text-gray-800">{getLeaveName(leave.leave_type_id)}</span>
                                                    <span className="text-xs text-gray-500 block">
                                                        {formatDate(leave.start_date)} – {formatDate(leave.end_date)} ({daysCount} Day{daysCount > 1 ? 's' : ''})
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{leave.status}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {isPendingAction ? (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleAction(leave.application_id, 'REJECTED')}
                                                                className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition">
                                                                Reject
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(leave.application_id, 'APPROVED')}
                                                                className="px-3 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition">
                                                                Approve
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 font-medium">Completed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: Configurations (Automated via Backend) */}
            {!isLoading && activeTab === 'config' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800">Leave Policies & Setup</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Leave policies are now globally automated and managed by the system.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-gray-100">
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Leave Name</th>
                                    <th className="py-4 px-6">Accrual Method</th>
                                    <th className="py-4 px-6">Carry Forward</th>
                                    <th className="py-4 px-6">Doc Threshold</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leaveTypes.map((type) => (
                                    <tr key={type.leave_type_id} className="hover:bg-gray-50 transition">
                                        <td className="py-4 px-6 font-bold text-gray-900 text-sm">{type.name}</td>
                                        <td className="py-4 px-6 text-xs text-gray-700">{type.accrual_method}</td>
                                        <td className="py-4 px-6 text-xs font-bold text-gray-800">{type.carry_forward_limit} Days</td>
                                        <td className="py-4 px-6 text-xs text-orange-600 font-medium">
                                            {type.doc_required_threshold > 0 ? `${type.doc_required_threshold} Days` : "None"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: Balances (Automated via Backend) */}
            {!isLoading && activeTab === 'balances' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Employee Leave Balances</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Balances are automatically credited by the system.</p>
                    </div>
                    <div className="p-6">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start space-x-4">
                            <Lightbulb className="text-emerald-600 shrink-0 mt-0.5" size={24} />
                            <div>
                                <h4 className="font-bold text-emerald-900 text-sm">System Automated Balances (Active)</h4>
                                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                    Leave balances (Earned, Casual, Sick, Maternity, Paternity) are now automatically assigned by the backend engine when an employee logs in or checks their dashboard. Manual allocation is no longer required.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}