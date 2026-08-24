import { useState, useEffect } from "react";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../shared/auth/AuthContext";
import { Users, CheckCircle, X, Check, AlertTriangle } from "lucide-react";

export default function ManagerDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [warningState, setWarningState] = useState({
        isOpen: false,
        applicationId: "",
        message: "",
        percentage: 0
    });

    const { employee } = useAuth();
    const managerId = employee?.employee_id;

    useEffect(() => {
        if (managerId) {
            fetchManagerData();
        }
    }, [managerId]);

    const fetchManagerData = async () => {
        setIsLoading(true);
        try {
            const typesData = await apiGet('/v1/leave/leave-types');
            setLeaveTypes(Array.isArray(typesData) ? typesData : []);

            const appsData = await apiGet(`/v1/leave/applications?employee_id=${managerId}&role=Manager`);
            const allApps = Array.isArray(appsData) ? appsData : [];

            // --- FRONTEND FILTER ADDED HERE ---
            // అడ్మిన్ అప్రూవ్ చేసినవి కాకుండా, కేవలం PENDING లో ఉన్నవి మాత్రమే మేనేజర్ కి చూపిస్తాం
            const pendingOnly = allApps.filter(app =>
                !app.status || app.status.toUpperCase() === "PENDING"
            );

            setRequests(pendingOnly);

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
            console.error("Error fetching Manager dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getLeaveTypeName = (leaveTypeId: string) => {
        const type = leaveTypes.find(t => t?.leave_type_id === leaveTypeId);
        return type ? type.name : "Unknown Leave";
    };

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
        if (days <= 0) return "-";
        return `${days} Day${days > 1 ? 's' : ''}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const handleAction = async (applicationId: string, actionType: 'APPROVED' | 'REJECTED', force: boolean = false) => {
        if (!managerId) return;

        try {
            const payload = {
                status: actionType,
                approver_id: managerId
            };

            const response = await fetch(`http://127.0.0.1:8000/api/v1/leave/applications/${applicationId}/status?force=${force}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();

                if (data.warning) {
                    setWarningState({
                        isOpen: true,
                        applicationId: applicationId,
                        message: data.message,
                        percentage: data.percentage
                    });
                    return;
                }

                setWarningState({ isOpen: false, applicationId: "", message: "", percentage: 0 });
                setRequests(prevRequests => prevRequests.filter(req => req.application_id !== applicationId));
                fetchManagerData();
            } else {
                const err = await response.json();
                console.error("Failed to update status:", err.detail || err);
            }
        } catch (error) {
            console.error("Error updating leave status:", error);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">Team Leave Approvals</h2>
                    <p className="text-sm text-gray-500 mt-1">Review and manage time-off requests from your direct team members.</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-4 shadow-sm">
                <Users className="text-blue-600 shrink-0 mt-0.5" size={24} />
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">Manager Responsibilities</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Ensure team availability before approving long leaves. The system will warn you if 30% or more of your team is absent simultaneously.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">Pending Team Actions ({requests.length})</h3>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-gray-500 font-bold animate-pulse">Loading team requests...</div>
                ) : requests.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 font-medium flex flex-col items-center">
                        <CheckCircle className="text-gray-300 mb-2" size={32} />
                        You are all caught up! No pending requests from your team.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-gray-100">
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Employee</th>
                                    <th className="py-4 px-6">Leave Details</th>
                                    <th className="py-4 px-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((req) => {
                                    const leaveName = getLeaveTypeName(req.leave_type_id);
                                    const totalDays = getDurationDays(req.start_date, req.end_date);

                                    // PHASE 1: Using the joined employee data from backend
                                    const empName = req.employee?.name || (req.employee?.first_name ? `${req.employee.first_name} ${req.employee.last_name || ''}`.trim() : null) || req.employee_id;
                                    const teamId = req.employee?.team_id || "Unassigned";

                                    return (
                                        <tr key={req.application_id} className="hover:bg-gray-50 transition">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs uppercase">
                                                        {empName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{empName}</p>
                                                        <p className="text-xs text-gray-500">
                                                            ID: <span className="font-semibold text-gray-600">{req.employee_id}</span> • Team: {teamId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col items-start">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold mb-1 bg-indigo-100 text-indigo-700">
                                                        {leaveName}
                                                    </span>
                                                    <span className="font-semibold text-gray-800 text-sm">
                                                        {formatDate(req.start_date)} – {formatDate(req.end_date)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{totalDays}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleAction(req.application_id, 'REJECTED')}
                                                        className="px-4 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition flex items-center space-x-1">
                                                        <X size={14} /> <span>Reject</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.application_id, 'APPROVED')}
                                                        className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-bold shadow-sm transition flex items-center space-x-1">
                                                        <Check size={14} /> <span>Approve</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {warningState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-amber-50 p-5 flex items-start space-x-4 border-b border-amber-100">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <AlertTriangle className="text-amber-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-900">Team Availability Warning</h3>
                                <p className="text-sm text-amber-800 mt-1">{warningState.message}</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Approving this request means <span className="font-bold text-gray-900">{warningState.percentage}%</span> of your team will be absent simultaneously during this period. Are you sure you want to proceed?
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100">
                            <button
                                onClick={() => setWarningState({ ...warningState, isOpen: false })}
                                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(warningState.applicationId, 'APPROVED', true)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                            >
                                Approve Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}