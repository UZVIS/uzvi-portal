import { useState, useEffect } from "react";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../shared/auth/AuthContext";
import { ShieldAlert, CheckCircle, X, Check, Paperclip, Download, AlertCircle } from "lucide-react";

export default function HRDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
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
    const hrId = employee?.employee_id;

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

    useEffect(() => {
        fetchHRData();
    }, []);

    const fetchHRData = async () => {
        setIsLoading(true);
        try {
            const typesData = await apiGet('/v1/leave/leave-types');
            setLeaveTypes(Array.isArray(typesData) ? typesData : []);

            const appsData = await apiGet('/v1/leave/applications?role=HR');
            setRequests(Array.isArray(appsData) ? appsData : []);

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
            console.error("Error fetching HR dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getLeaveTypeName = (leaveTypeId: string) => {
        const type = leaveTypes.find(t => t?.leave_type_id === leaveTypeId);
        return type ? type.name : "Special Leave";
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const getStoredDocument = (applicationId: string) => {
        try {
            const storedDocs = JSON.parse(localStorage.getItem("leaveDocuments") || "{}");
            return storedDocs[applicationId] || null;
        } catch {
            return null;
        }
    };

    // --- FIX: Secure way to view Base64 documents in a new tab ---
    const handleViewDocument = (fileData: string, fileType: string) => {
        if (!fileData) return;
        try {
            // Split the Base64 string from the "data:application/pdf;base64," prefix
            const base64Str = fileData.split(',')[1];
            const byteCharacters = atob(base64Str);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Create a Blob and an Object URL
            const blob = new Blob([byteArray], { type: fileType || 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);

            // Open the safe Blob URL in a new tab
            window.open(blobUrl, '_blank');
        } catch (error) {
            console.error("Error viewing document:", error);
            // Fallback (for older browsers)
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`<iframe src="${fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
            }
        }
    };

    const handleAction = async (applicationId: string, actionType: 'APPROVED' | 'REJECTED') => {
        if (!hrId) return;

        try {
            const payload = {
                status: actionType,
                approver_id: hrId
            };

            const response = await fetch(`http://127.0.0.1:8000/api/v1/leave/applications/${applicationId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setRequests(prevRequests => prevRequests.filter(req => req.application_id !== applicationId));
                fetchHRData();

                setModalState({
                    isOpen: true,
                    title: "Success",
                    message: `Leave application successfully ${actionType.toLowerCase() === 'approved' ? 'verified and approved' : 'rejected'}.`,
                    isError: false
                });
            } else {
                const err = await response.json();
                setModalState({
                    isOpen: true,
                    title: "Action Failed",
                    message: err.detail || "Insufficient Balance or Server Error occurred.",
                    isError: true
                });
            }
        } catch (error) {
            console.error("Error updating leave status:", error);
            setModalState({
                isOpen: true,
                title: "Network Error",
                message: "Unable to connect to the server while updating status.",
                isError: true
            });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">HR Medical and Compliance View</h2>
                    <p className="text-sm text-gray-500 mt-1">Review sensitive leave requests and finalize approvals.</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start space-x-4 shadow-md">
                <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={24} />
                <div>
                    <h4 className="font-bold text-white text-sm">Strict Confidentiality Required</h4>
                    <p className="text-xs text-slate-300 mt-1">You are viewing restricted medical and compliance data. Do not share these reasons with the employee's direct manager.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">Pending HR Verifications ({requests.length})</h3>
                </div>
                {isLoading ? (
                    <div className="p-10 text-center text-gray-500 font-bold">Loading HR requests...</div>
                ) : requests.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 font-medium flex flex-col items-center">
                        <CheckCircle className="text-emerald-500 mb-2" size={32} />
                        All sensitive requests have been verified.
                    </div>
                ) : (
                    <div className="overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-white border-b border-gray-100">
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 px-4 w-[25%]">Employee</th>
                                    <th className="py-4 px-4 w-[20%]">Leave Type</th>
                                    <th className="py-4 px-4 w-[30%]">Private Notes & Document</th>
                                    <th className="py-4 px-4 w-[25%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((req) => {
                                    const leaveName = getLeaveTypeName(req.leave_type_id);
                                    const totalDays = getDurationDays(req.start_date, req.end_date);
                                    const attachedDoc = getStoredDocument(req.application_id);

                                    // PHASE 1: Using the joined employee data from backend
                                    const empName = req.employee?.name || (req.employee?.first_name ? `${req.employee.first_name} ${req.employee.last_name || ''}`.trim() : null) || req.employee_id;
                                    const teamId = req.employee?.team_id || "Unassigned";

                                    return (
                                        <tr key={req.application_id} className="hover:bg-gray-50 transition">
                                            <td className="py-4 px-4 align-top">
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs shrink-0 uppercase">
                                                        {empName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 truncate">{empName}</p>
                                                        <p className="text-xs text-gray-500">
                                                            ID: <span className="font-semibold text-gray-600">{req.employee_id}</span> • Team: {teamId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-top">
                                                <div className="flex flex-col items-start mt-1 min-w-0">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold mb-1.5 bg-pink-100 text-pink-700 inline-block">
                                                        {leaveName}
                                                    </span>
                                                    <span className="font-semibold text-gray-800 text-sm truncate w-full">
                                                        {req.start_date === req.end_date
                                                            ? formatDate(req.start_date)
                                                            : `${formatDate(req.start_date)} – ${formatDate(req.end_date)}`}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{totalDays}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-top pr-6">
                                                <p className="text-sm text-gray-800 font-medium mb-2 mt-1 break-words line-clamp-2">
                                                    {req.reason || "Medical leave request exceeding threshold."}
                                                </p>

                                                {attachedDoc ? (
                                                    <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2 flex items-center justify-between w-full gap-2">
                                                        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                                            <Paperclip size={14} className="text-blue-600 shrink-0" />
                                                            <span className="text-[11px] font-bold text-blue-900 truncate w-full" title={attachedDoc.fileName}>
                                                                {attachedDoc.fileName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-1 shrink-0">
                                                            <button
                                                                onClick={() => handleViewDocument(attachedDoc.fileData, attachedDoc.fileType)}
                                                                className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700 transition cursor-pointer"
                                                            >
                                                                View
                                                            </button>
                                                            <a
                                                                href={attachedDoc.fileData}
                                                                download={attachedDoc.fileName}
                                                                className="p-1 bg-white border border-blue-200 text-blue-600 rounded hover:bg-blue-50 transition flex items-center justify-center cursor-pointer"
                                                                title="Download"
                                                            >
                                                                <Download size={12} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-amber-600 font-medium italic mt-1 block">No document attached locally</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 align-top text-right">
                                                <div className="flex justify-end space-x-2 mt-1">
                                                    <button onClick={() => handleAction(req.application_id, 'REJECTED')} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition flex items-center space-x-1 shrink-0">
                                                        <X size={14} /> <span>Reject</span>
                                                    </button>
                                                    <button onClick={() => handleAction(req.application_id, 'APPROVED')} className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-sm font-bold shadow-sm transition flex items-center space-x-1 shrink-0">
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