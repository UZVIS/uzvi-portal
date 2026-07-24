import { useState, useEffect } from "react";
// 🌟 Premium Icons
import { Lightbulb, Plus, Activity, Settings2, Wallet } from "lucide-react";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'tracker' | 'config' | 'balances'>('tracker');
    const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

    const [leaveName, setLeaveName] = useState("");
    const [accrualMethod, setAccrualMethod] = useState("");
    const [carryForwardLimit, setCarryForwardLimit] = useState("");
    const [docThreshold, setDocThreshold] = useState("");

    const [targetEmployeeId, setTargetEmployeeId] = useState("EMP123");
    const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
    const [allocateBalanceValue, setAllocateBalanceValue] = useState("");
    const [allocateYear, setAllocateYear] = useState("2026");

    const [allLeaves, setAllLeaves] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const typesResponse = await fetch("http://127.0.0.1:8000/api/v1/leave/leave-types");
            if (typesResponse.ok) {
                const typesData = await typesResponse.json();
                const validTypes = Array.isArray(typesData) ? typesData : [];
                setLeaveTypes(validTypes);
                if (validTypes.length > 0) {
                    setSelectedLeaveTypeId(validTypes[0].leave_type_id);
                }
            }

            const appsResponse = await fetch("http://127.0.0.1:8000/api/v1/leave/applications");
            if (appsResponse.ok) {
                const appsData = await appsResponse.json();
                setAllLeaves(Array.isArray(appsData) ? appsData : []);
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

    const getDurationDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const handleSaveLeaveType = async () => {
        if (!leaveName) return;

        const payload = {
            name: leaveName,
            accrual_method: accrualMethod || "Standard",
            carry_forward_limit: carryForwardLimit ? parseInt(carryForwardLimit, 10) : 0,
            doc_required_threshold: docThreshold ? parseInt(docThreshold, 10) : 0
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/leave-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                fetchAdminData();
                setIsAddLeaveModalOpen(false);
                setLeaveName("");
                setAccrualMethod("");
                setCarryForwardLimit("");
                setDocThreshold("");
            } else {
                alert("Failed to create leave type.");
            }
        } catch (error) {
            console.error("Error connecting to backend API:", error);
        }
    };

    const handleAllocateBalance = async () => {
        if (!targetEmployeeId || !selectedLeaveTypeId || !allocateBalanceValue || !allocateYear) {
            alert("Please fill all fields!");
            return;
        }

        const payload = {
            employee_id: targetEmployeeId.trim(),
            leave_type_id: selectedLeaveTypeId,
            year: parseInt(allocateYear, 10),
            balance: parseFloat(allocateBalanceValue)
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/leave/leave-balances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Leave balance allocated successfully!");
                setIsBalanceModalOpen(false);
                setAllocateBalanceValue("");
                fetchAdminData();
            } else {
                const err = await response.json();
                alert(`Failed to allocate balance: ${JSON.stringify(err.detail || err)}`);
            }
        } catch (error) {
            console.error("Error allocating balance:", error);
            alert("Network error occurred.");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
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
                                    <th className="py-4 px-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allLeaves.length === 0 ? (
                                    <tr><td colSpan={3} className="py-8 text-center text-gray-500">No leave applications found.</td></tr>
                                ) : (
                                    allLeaves.map((leave) => (
                                        <tr key={leave.application_id} className="hover:bg-gray-50 transition">
                                            <td className="py-4 px-6 font-bold text-gray-900">{leave.employee_id}</td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-sm text-gray-800">{getLeaveName(leave.leave_type_id)}</span>
                                                <span className="text-xs text-gray-500 block">
                                                    {formatDate(leave.start_date)} – {formatDate(leave.end_date)} ({getDurationDays(leave.start_date, leave.end_date)} Days)
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{leave.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && activeTab === 'config' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Leave Policies & Setup</h3>
                        <button onClick={() => setIsAddLeaveModalOpen(true)} className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition flex items-center space-x-1">
                            <Plus size={14} /> <span>Add Leave Type</span>
                        </button>
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
                                        <td className="py-4 px-6 text-xs text-orange-600 font-medium">{type.doc_required_threshold} Days</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && activeTab === 'balances' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800">Employee Leave Balances</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Allocate and manage entitled leaves for employees.</p>
                        </div>
                        <button onClick={() => setIsBalanceModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm flex items-center space-x-1">
                            <Plus size={14} /> <span>Allocate Balance</span>
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-4">
                            <Lightbulb className="text-indigo-600 shrink-0 mt-0.5" size={24} />
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm">Quick Fix for "Leave Balance Not Found"</h4>
                                <p className="text-xs text-indigo-700 mt-1">If managers face errors while approving leaves, make sure the employee has an active balance allocated here.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals are kept exactly the same (logic wise) */}
            {isAddLeaveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden">
                        <div className="p-8 pb-4"><h2 className="text-[20px] font-bold text-gray-900 mb-1">Create Leave Type</h2></div>
                        <div className="px-8 space-y-4">
                            <input type="text" value={leaveName} onChange={(e) => setLeaveName(e.target.value)} placeholder="Leave Name (e.g. Casual Leave)" className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600" />
                            <input type="text" value={accrualMethod} onChange={(e) => setAccrualMethod(e.target.value)} placeholder="Accrual Method" className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600" />
                            <input type="number" value={carryForwardLimit} onChange={(e) => setCarryForwardLimit(e.target.value)} placeholder="Carry Forward Limit" className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600" />
                            <input type="number" value={docThreshold} onChange={(e) => setDocThreshold(e.target.value)} placeholder="Doc Required Threshold" className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600" />
                        </div>
                        <div className="p-8 pt-6 flex justify-end space-x-3 bg-gray-50 border-t mt-4">
                            <button onClick={() => setIsAddLeaveModalOpen(false)} className="px-5 py-2.5 bg-white border rounded-xl text-sm font-semibold hover:bg-gray-100">Cancel</button>
                            <button onClick={handleSaveLeaveType} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {isBalanceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-in fade-in duration-200">
                        <div className="p-6 pb-4 border-b">
                            <h2 className="text-[18px] font-bold text-gray-900">Allocate Leave Balance</h2>
                            <p className="text-xs text-gray-500">Post initial balance for an employee.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Employee ID</label>
                                <input type="text" value={targetEmployeeId} onChange={(e) => setTargetEmployeeId(e.target.value)} placeholder="e.g. EMP123" className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Leave Type</label>
                                <select value={selectedLeaveTypeId} onChange={(e) => setSelectedLeaveTypeId(e.target.value)} className="w-full border rounded-xl px-4 py-2 text-sm bg-white outline-none focus:border-indigo-600">
                                    {leaveTypes.map((type) => (
                                        <option key={type.leave_type_id} value={type.leave_type_id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Year</label>
                                <input type="number" value={allocateYear} onChange={(e) => setAllocateYear(e.target.value)} placeholder="e.g. 2026" className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Entitlement Balance (Days)</label>
                                <input type="number" value={allocateBalanceValue} onChange={(e) => setAllocateBalanceValue(e.target.value)} placeholder="e.g. 12" className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600" />
                            </div>
                        </div>
                        <div className="p-4 px-6 flex justify-end space-x-3 bg-gray-50 border-t">
                            <button onClick={() => setIsBalanceModalOpen(false)} className="px-4 py-2 bg-white border rounded-xl text-xs font-semibold hover:bg-gray-100">Cancel</button>
                            <button onClick={handleAllocateBalance} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition">Allocate</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}