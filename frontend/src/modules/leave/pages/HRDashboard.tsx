import { useState, useEffect } from "react";
import { apiGet } from "../../../api/client";
// 🌟 Premium Icons
import { ShieldAlert, CheckCircle, Paperclip, X, Check } from "lucide-react";

export default function HRDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHRData();
    }, []);

    const fetchHRData = async () => {
        setIsLoading(true);
        try {
            const typesData = await apiGet('/v1/leave/leave-types');
            setLeaveTypes(Array.isArray(typesData) ? typesData : []);

            const appsData = await apiGet('/v1/leave/applications');
            if (Array.isArray(appsData)) {
                const hrPendingApps = appsData.filter(app =>
                    app?.status?.toUpperCase() === "PENDING_HR" ||
                    app?.status?.toUpperCase() === "PENDING"
                );
                setRequests(hrPendingApps);
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

    const getDurationDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const handleAction = async (applicationId: string, actionType: 'APPROVED' | 'REJECTED') => {
        try {
            const payload = {
                status: actionType,
                approver_id: "HR001"
            };

            const response = await fetch(`http://127.0.0.1:8000/api/v1/leave/applications/${applicationId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(`Leave request ${actionType.toLowerCase()} successfully!`);
                fetchHRData();
            } else {
                const err = await response.json();
                alert(`Failed to update status: ${JSON.stringify(err.detail || err)}`);
            }
        } catch (error) {
            console.error("Error updating leave status:", error);
            alert("Network error while updating status.");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">HR Medical & Compliance View</h2>
                    <p className="text-sm text-gray-500 mt-1">Review sensitive leave requests and verify medical documents.</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start space-x-4 shadow-md">
                <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={24} />
                <div>
                    <h4 className="font-bold text-white text-sm">Strict Confidentiality Required</h4>
                    <p className="text-xs text-slate-300 mt-1">You are viewing restricted medical and maternity data. Do not share these reasons or documents with the employee's direct manager.</p>
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-gray-100">
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Employee</th>
                                    <th className="py-4 px-6">Leave Type</th>
                                    <th className="py-4 px-6">Private Medical Notes</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((req) => {
                                    const leaveName = getLeaveTypeName(req.leave_type_id);
                                    const totalDays = getDurationDays(req.start_date, req.end_date);
                                    return (
                                        <tr key={req.application_id} className="hover:bg-gray-50 transition">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs">
                                                        {req.employee_id.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{req.employee_id}</p>
                                                        <p className="text-xs text-gray-500">Employee</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col items-start">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold mb-1 bg-pink-100 text-pink-700">{leaveName}</span>
                                                    <span className="font-semibold text-gray-800 text-sm">{formatDate(req.start_date)} – {formatDate(req.end_date)}</span>
                                                    <span className="text-xs text-gray-500">{totalDays} Days</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 max-w-sm">
                                                <p className="text-sm text-gray-800 font-medium">{req.reason || "No medical notes provided."}</p>
                                                <div className="mt-2 flex items-center space-x-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 inline-flex transition">
                                                    <Paperclip size={14} /><span>Medical_Proof_Document.pdf</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => handleAction(req.application_id, 'REJECTED')} className="px-4 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition flex items-center space-x-1">
                                                        <X size={14} /> <span>Reject</span>
                                                    </button>
                                                    <button onClick={() => handleAction(req.application_id, 'APPROVED')} className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-sm font-bold shadow-sm transition flex items-center space-x-1">
                                                        <Check size={14} /> <span>Verify & Approve</span>
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
        </div>
    );
}