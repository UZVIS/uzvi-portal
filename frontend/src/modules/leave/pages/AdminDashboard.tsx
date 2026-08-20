import { useState, useEffect } from "react";
import { useAuth } from "../../../shared/auth/AuthContext";
import { apiGet } from "../../../api/client";
import { Activity, CheckCircle, AlertCircle, X, Check } from "lucide-react";

export default function AdminDashboard() {
    const [allLeaves, setAllLeaves] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        isError: false
    });

    const { employee } = useAuth();
    const adminId = employee?.employee_id;

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
            const allApps = Array.isArray(appsData) ? appsData : [];

            allApps.sort((a, b) => {
                const aPending = a.status === 'PENDING' || a.status === 'PENDING_HR';
                const bPending = b.status === 'PENDING' || b.status === 'PENDING_HR';
                if (aPending && !bPending) return -1;
                if (!aPending && bPending) return 1;
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            });

            setAllLeaves(allApps);

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

            const response = await fetch(`http://127.0.0.1:8000/api/v1/leave/applications/${applicationId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchAdminData();
                setModalState({
                    isOpen: true,
                    title: "Success",
                    message: `Leave application successfully ${actionType.toLowerCase()} by Admin.`,
                    isError: false
                });
            } else {
                const err = await response.json();
                setModalState({
                    isOpen: true,
                    title: "Action Failed",
                    message: err.detail || "Error occurred while processing request.",
                    isError: true
                });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            setModalState({
                isOpen: true,
                title: "Network Error",
                message: "Unable to connect to the server.",
                isError: true
            });
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 relative">

            {isLoading ? (
                <div className="text-center py-20 text-gray-500 font-bold animate-pulse">Loading Data...</div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100 bg-gray-50/30">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-800">Admin Control Center</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage org-wide leave activity and approvals.</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-gray-700 shadow-sm">
                            <Activity size={16} className="text-indigo-600" />
                            <span className="text-sm font-extrabold tracking-wide">Global Tracker</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-gray-100">
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 px-6 w-[25%]">Employee</th>
                                    <th className="py-4 px-6 w-[35%]">Leave Details</th>
                                    <th className="py-4 px-6 w-[15%]">Status</th>
                                    <th className="py-4 px-6 w-[25%] text-center">Actions</th>
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

                                        const empName = leave.employee?.name || (leave.employee?.first_name ? `${leave.employee.first_name} ${leave.employee.last_name || ''}`.trim() : null) || leave.employee_id;
                                        const teamId = leave.employee?.team_id || "Unassigned";

                                        return (
                                            <tr key={leave.application_id} className={`hover:bg-gray-50 transition ${isPendingAction ? 'bg-amber-50/20' : ''}`}>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-gray-900">{empName}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        ID: <span className="font-semibold text-gray-600">{leave.employee_id}</span> • Team: {teamId}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-bold text-sm text-gray-800">{getLeaveName(leave.leave_type_id)}</span>
                                                    <span className="text-xs text-gray-500 block mt-0.5">
                                                        {formatDate(leave.start_date)} – {formatDate(leave.end_date)} ({daysCount} Day{daysCount > 1 ? 's' : ''})
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${currentStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            currentStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {currentStatus || "PENDING"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {isPendingAction ? (
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() => handleAction(leave.application_id, 'REJECTED')}
                                                                className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition flex items-center space-x-1">
                                                                <X size={14} /> <span>Reject</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(leave.application_id, 'APPROVED')}
                                                                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm">
                                                                <Check size={14} /> <span>Approve</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center">
                                                            <span className="text-xs text-gray-400 font-medium italic">Action Completed</span>
                                                        </div>
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

            {/* MODAL POPUP */}
            {modalState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-5 flex items-start space-x-4 border-b ${modalState.isError ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className={`p-2 rounded-full ${modalState.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {modalState.isError ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${modalState.isError ? 'text-red-900' : 'text-emerald-900'}`}>{modalState.title}</h3>
                                <p className={`text-sm mt-1 ${modalState.isError ? 'text-red-800' : 'text-emerald-800'}`}>{modalState.message}</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end border-t border-gray-100">
                            <button
                                onClick={() => setModalState({ isOpen: false, title: "", message: "", isError: false })}
                                className={`px-5 py-2 text-white rounded-xl text-sm font-bold shadow-sm transition ${modalState.isError ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-black'}`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}