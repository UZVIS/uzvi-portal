import { useState, useEffect } from "react";
import { apiPost, apiGet } from "../../../api/client";
// 🌟 Premium Icons imported
import { CalendarPlus, Paperclip, Lock, Check, X, Clock, AlertCircle } from "lucide-react";

export default function LeaveDashboard() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
    const [leaveTypeId, setLeaveTypeId] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const employeeId = "EMP123";

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const typesData = await apiGet('/v1/leave/leave-types');
                const validTypes = Array.isArray(typesData) ? typesData : [];
                setLeaveTypes(validTypes);
                if (validTypes.length > 0) {
                    setLeaveTypeId(validTypes[0].leave_type_id);
                }

                const balancesData = await apiGet(`/v1/leave/leave-balances/${employeeId}`);
                setLeaveBalances(Array.isArray(balancesData) ? balancesData : [balancesData]);

                const allApplications = await apiGet('/v1/leave/applications');
                if (Array.isArray(allApplications)) {
                    const myApplications = allApplications.filter(app => app.employee_id === employeeId);
                    setLeaveHistory(myApplications);
                } else {
                    setLeaveHistory([]);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        }
        fetchDashboardData();
    }, []);

    const getBalanceFor = (leaveName: string) => {
        if (!leaveTypes.length || !leaveBalances.length) return "0";
        const type = leaveTypes.find(t => t?.name?.toLowerCase().includes(leaveName.toLowerCase()));
        if (!type) return "0";
        const balanceRecord = leaveBalances.find(b => b?.leave_type_id === type.leave_type_id);
        return balanceRecord ? balanceRecord.balance : "0";
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

    const getDurationDays = (start: string, end: string) => {
        if (!start || !end) return "-";
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    };

    const getDurationNumber = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const appliedDaysNumber = getDurationNumber(startDate, endDate);
    const selectedTypeDetails = (leaveTypes || []).find(t => t?.leave_type_id === leaveTypeId);
    const threshold = selectedTypeDetails?.doc_required_threshold ?? 0;
    const typeNameLower = selectedTypeDetails?.name?.toLowerCase() || "";

    const isSpecialLeave = typeNameLower.includes("maternity") || typeNameLower.includes("paternity");
    const isDocumentMandatory = isSpecialLeave || (threshold > 0 && appliedDaysNumber > threshold);

    const resetForm = () => {
        setIsFormOpen(false);
        setStartDate("");
        setEndDate("");
        setReason("");
        setAttachment(null);
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            alert("Please select start and end dates.");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(startDate) < today) {
            alert("Leave start date cannot be in the past!");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert("End date cannot be before start date.");
            return;
        }

        if (reason.trim().length < 5) {
            alert("Please enter a valid reason (at least 5 characters).");
            return;
        }

        if (isDocumentMandatory && !attachment) {
            alert("Please upload the required medical/proof document to proceed.");
            return;
        }

        setIsSubmitting(true);

        const leaveData = {
            employee_id: employeeId,
            leave_type_id: leaveTypeId,
            start_date: startDate,
            end_date: endDate,
            reason: reason
        };

        try {
            await apiPost('/v1/leave/applications', leaveData);
            alert("Leave request submitted successfully!");

            const updatedAllApps = await apiGet('/v1/leave/applications');
            if (Array.isArray(updatedAllApps)) {
                setLeaveHistory(updatedAllApps.filter(app => app.employee_id === employeeId));
            }

            resetForm();
        } catch (error: any) {
            console.error("Error submitting leave:", error);
            let errorMessage = "Submission failed. Please try again.";
            if (error?.response?.data?.detail) {
                errorMessage = Array.isArray(error.response.data.detail)
                    ? error.response.data.detail[0].msg
                    : error.response.data.detail;
            }
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const latestLeave = leaveHistory.length > 0 ? leaveHistory[leaveHistory.length - 1] : null;
    const latestStatus = latestLeave?.status?.toUpperCase() || "";

    const isManagerApproved = latestStatus === "APPROVED" || latestStatus === "PENDING_HR" || latestStatus === "HR_APPROVED";
    const isHRVerified = latestStatus === "APPROVED" || latestStatus === "HR_APPROVED";
    const isRejected = latestStatus === "REJECTED";

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">My Leave Wallet</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your balances and track upcoming time off.</p>
                </div>
                <button onClick={() => setIsFormOpen(true)} className="mt-4 md:mt-0 bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center space-x-2 shadow-md">
                    <CalendarPlus size={18} />
                    <span>Request Leave</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold tracking-wider text-blue-600 uppercase mb-1">Earned Leave</p>
                            <h3 className="text-3xl font-black text-blue-950">{getBalanceFor("Earned")} <span className="text-sm font-medium text-blue-700/60">Balance</span></h3>
                        </div>
                        <div className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs">EL</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold tracking-wider text-emerald-600 uppercase mb-1">Casual Leave</p>
                            <h3 className="text-3xl font-black text-emerald-950">{getBalanceFor("Casual")} <span className="text-sm font-medium text-emerald-700/60">Balance</span></h3>
                        </div>
                        <div className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-xs">CL</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold tracking-wider text-rose-600 uppercase mb-1">Sick Leave</p>
                            <h3 className="text-3xl font-black text-rose-950">{getBalanceFor("Sick")} <span className="text-sm font-medium text-rose-700/60">Balance</span></h3>
                        </div>
                        <div className="bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded text-xs">SL</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold tracking-wider text-amber-600 uppercase mb-1">Comp Off</p>
                            <h3 className="text-3xl font-black text-amber-950">{getBalanceFor("Comp")} <span className="text-sm font-medium text-amber-700/60">Balance</span></h3>
                        </div>
                        <div className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-xs">CO</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/80 border-b border-gray-200">
                                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="py-4 px-6">Leave Details</th>
                                    <th className="py-4 px-6">Duration</th>
                                    <th className="py-4 px-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(!leaveHistory || leaveHistory.length === 0) ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500 text-sm">No recent leave activity found.</td>
                                    </tr>
                                ) : (
                                    leaveHistory.map((leave) => (
                                        <tr key={leave?.application_id || Math.random()} className="hover:bg-gray-50 transition">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{getLeaveName(leave?.leave_type_id)}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">
                                                        {leave?.start_date === leave?.end_date
                                                            ? formatDate(leave?.start_date)
                                                            : `${formatDate(leave?.start_date)} – ${formatDate(leave?.end_date)}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-gray-700">{getDurationDays(leave?.start_date, leave?.end_date)}</td>
                                            <td className="py-4 px-6 text-right">
                                                {leave?.status?.toUpperCase() === "APPROVED" && (
                                                    <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><span>Approved</span>
                                                    </span>
                                                )}
                                                {(leave?.status?.toUpperCase().includes("PENDING") || !leave?.status) && (
                                                    <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span><span>Pending</span>
                                                    </span>
                                                )}
                                                {leave?.status?.toUpperCase() === "REJECTED" && (
                                                    <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span><span>Rejected</span>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Status Tracker</h3>
                        {latestLeave ? (
                            <>
                                <p className="text-xs font-semibold text-amber-600 mb-5 bg-amber-50 inline-block px-2 py-1 rounded">
                                    {latestStatus}: {getLeaveName(latestLeave.leave_type_id)} ({formatDate(latestLeave.start_date)})
                                </p>
                                <div className="space-y-5">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                            <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                        </div>
                                        <div className="pb-2">
                                            <p className="font-bold text-sm text-gray-900">Request Submitted</p>
                                            <p className="text-xs text-gray-500">By You</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${isManagerApproved ? 'bg-green-500 text-white' : isRejected ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}`}>
                                                {isManagerApproved ? <Check size={14} strokeWidth={3} /> : isRejected ? <X size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={3} />}
                                            </div>
                                            <div className="w-0.5 h-full bg-gray-100 my-1"></div>
                                        </div>
                                        <div className="pb-2">
                                            <p className="font-bold text-sm text-gray-900">Manager Review</p>
                                            <p className="text-xs text-gray-500">{isManagerApproved ? 'Approved by Manager' : isRejected ? 'Rejected by Manager' : 'Pending Action'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${isHRVerified ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                {isHRVerified ? <Check size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}
                                            </div>
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${isHRVerified ? 'text-gray-900' : 'text-gray-400'}`}>HR Verification</p>
                                            <p className="text-xs text-gray-400">{isHRVerified ? 'Completed' : 'If required'}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-gray-500 py-4 text-center">No active leave requests to track.</p>
                        )}
                    </div>

                    {/* 🌟 Premium Privacy Box */}
                    <div className="bg-slate-900 rounded-xl p-4 flex gap-3 items-start shadow-md border border-slate-800">
                        <Lock className="text-slate-400 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-bold text-white mb-1">Strict Privacy Enabled</p>
                            <p className="text-xs text-slate-300 leading-relaxed">Your medical leave reasons are encrypted and hidden from direct managers per company policy.</p>
                        </div>
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 pb-3 shrink-0 border-b border-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-[20px] font-bold text-gray-900 mb-0.5">Apply for leave</h2>
                                    <p className="text-xs text-gray-500">Request time off — routes to your reporting manager.</p>
                                </div>
                                <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 space-y-3 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Leave type</label>
                                <select className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 bg-white" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
                                    {(leaveTypes || []).map((type) => (
                                        <option key={type?.leave_type_id} value={type?.leave_type_id}>
                                            {type?.name} {type?.doc_required_threshold > 0 ? `(Doc > ${type.doc_required_threshold}d)` : ''}
                                        </option>
                                    ))}
                                    {(!leaveTypes || leaveTypes.length === 0) && <option value="">Loading types...</option>}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">From</label>
                                    <input type="date" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
                                    <input type="date" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900" placeholder="A short note for your manager..." value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
                            </div>

                            {isDocumentMandatory && (
                                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 animate-in fade-in duration-200">
                                    <label className="text-xs font-bold text-blue-900 mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Paperclip size={14} className="text-blue-600" /> Upload Medical Proof
                                        </span>
                                        <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Required ({threshold} Days)</span>
                                    </label>
                                    <p className="text-[11px] text-blue-700/80 mb-3 leading-relaxed">Your request exceeds the allowed limit without proof. Please attach a valid document.</p>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer" />
                                </div>
                            )}
                        </div>

                        <div className="p-4 px-6 flex justify-end space-x-3 shrink-0 bg-gray-50/80 border-t border-gray-100">
                            <button onClick={resetForm} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 shadow-sm">
                                {isSubmitting ? 'Submitting...' : 'Submit request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}