import { useState } from "react";
import { useCalendar } from "../hooks/useCalendar";
import { Palmtree, CalendarDays, User, MapPin, Search, X, Upload, CheckCircle, AlertCircle } from "lucide-react";

export default function CalendarPage({ role = "Admin" }: { role?: string }) {
    const {
        currentDate, setCurrentDate, isLoading, filteredData,
        selectedTeam, setSelectedTeam, selectedState, setSelectedState,
        selectedType, setSelectedType, searchQuery, setSearchQuery, refresh
    } = useCalendar(role);

    // --- HOLIDAY IMPORT STATES ---
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [holidayFile, setHolidayFile] = useState<File | null>(null);
    const [isHolidayImporting, setIsHolidayImporting] = useState(false);
    const [holidayStatus, setHolidayStatus] = useState<{ success: boolean; message: string } | null>(null);

    // --- EVENT IMPORT STATES ---
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventFile, setEventFile] = useState<File | null>(null);
    const [isEventImporting, setIsEventImporting] = useState(false);
    const [eventStatus, setEventStatus] = useState<{ success: boolean; message: string } | null>(null);

    const teams = ["All", "Engineering", "HR", "QA", "Design"];
    const states = ["All", "National", "AP", "TS", "MH"];
    const types = ["All", "Holiday", "Event", "Leave"];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const currentMonthEvents: any[] = [];
    const eventsByDay: Record<number, any[]> = {};
    let holidayCount = 0; let eventCount = 0; let leaveCount = 0;

    filteredData.forEach(item => {
        let currDate = new Date(item.date);
        currDate.setHours(0, 0, 0, 0);
        let endDate = new Date(item.endDate);
        endDate.setHours(23, 59, 59, 999);
        let addedToPanel = false;

        while (currDate <= endDate) {
            if (currDate.getFullYear() === year && currDate.getMonth() === month) {
                const dayNum = currDate.getDate();
                if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
                eventsByDay[dayNum].push(item);

                if (!addedToPanel) {
                    currentMonthEvents.push({ ...item, displayDay: item.date.getDate() });
                    if (item.type === "Holiday") holidayCount++;
                    if (item.type === "Event") eventCount++;
                    if (item.type === "Leave") leaveCount++;
                    addedToPanel = true;
                }
            }
            currDate.setDate(currDate.getDate() + 1);
        }
    });

    currentMonthEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    const todayNum = new Date().getDate();
    const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;
    const todaysEvents = isCurrentMonth ? (eventsByDay[todayNum] || []) : [];

    const upcomingEvents = currentMonthEvents.filter(e => e.type !== "Leave" && (!isCurrentMonth || e.displayDay > todayNum));
    const myLeaves = currentMonthEvents.filter(e => e.type === "Leave" && e.isMine);
    const teamLeaves = currentMonthEvents.filter(e => e.type === "Leave" && !e.isMine);

    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDayOffset = new Date(year, month, 1).getDay() === 0 ? 6 : new Date(year, month, 1).getDay() - 1;
    const emptyDays = Array.from({ length: startDayOffset }, (_, i) => i);
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // --- HANDLE HOLIDAY IMPORT ---
    const handleHolidayImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!holidayFile) return;

        setIsHolidayImporting(true);
        setHolidayStatus(null);

        const formData = new FormData();
        formData.append("file", holidayFile);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/calendar/holidays/import", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setHolidayStatus({ success: true, message: data.message || "Holidays imported successfully!" });
                setHolidayFile(null);
                refresh();
            } else {
                const err = await response.json();
                setHolidayStatus({ success: false, message: err.detail || "Failed to import holidays." });
            }
        } catch (error) {
            console.error("Network error while importing holidays:", error);
            setHolidayStatus({ success: false, message: "Network error occurred." });
        } finally {
            setIsHolidayImporting(false);
        }
    };

    // --- HANDLE EVENT IMPORT ---
    const handleEventImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventFile) return;

        setIsEventImporting(true);
        setEventStatus(null);

        const formData = new FormData();
        formData.append("file", eventFile);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/calendar/events/import", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setEventStatus({ success: true, message: data.message || "Events imported successfully!" });
                setEventFile(null);
                refresh();
            } else {
                const err = await response.json();
                setEventStatus({ success: false, message: err.detail || "Failed to import events." });
            }
        } catch (error) {
            console.error("Network error while importing events:", error);
            setEventStatus({ success: false, message: "Network error occurred." });
        } finally {
            setIsEventImporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1500px] mx-auto p-4 md:p-6">

            {/* Top Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div><p className="text-sm font-bold text-gray-500">Holidays</p><p className="text-2xl font-black text-emerald-600">{holidayCount}</p></div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><Palmtree size={20} /></div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div><p className="text-sm font-bold text-gray-500">Events</p><p className="text-2xl font-black text-indigo-600">{eventCount}</p></div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><CalendarDays size={20} /></div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div><p className="text-sm font-bold text-gray-500">Leaves</p><p className="text-2xl font-black text-orange-600">{leaveCount}</p></div>
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600"><User size={20} /></div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between text-white">
                    <div><p className="text-sm font-bold text-slate-400">Today</p><p className="text-xl font-black">{new Date().toLocaleDateString('default', { day: 'numeric', month: 'short' })}</p></div>
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300"><MapPin size={20} /></div>
                </div>
            </div>

            {/* Filters and Actions Toolbar */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="font-bold text-gray-500 hover:text-black">&lt;</button>
                        <span className="text-sm font-bold min-w-[100px] text-center">{monthName}</span>
                        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="font-bold text-gray-500 hover:text-black">&gt;</button>
                    </div>

                    <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium outline-none focus:border-slate-900">
                        {teams.map(t => <option key={t} value={t}>{t === "All" ? "Team: All" : t}</option>)}
                    </select>

                    <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium outline-none focus:border-slate-900">
                        {states.map(s => <option key={s} value={s}>{s === "All" ? "State: All" : s}</option>)}
                    </select>

                    <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium outline-none focus:border-slate-900">
                        {types.map(t => <option key={t} value={t}>{t === "All" ? "Type: All" : t}</option>)}
                    </select>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    {role === "Admin" && (
                        <div className="flex space-x-2">
                            <button onClick={() => { setShowHolidayModal(true); setHolidayStatus(null); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm transition whitespace-nowrap flex items-center space-x-1.5">
                                <Upload size={16} /> <span>Import Holidays</span>
                            </button>
                            <button onClick={() => { setShowEventModal(true); setEventStatus(null); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm transition whitespace-nowrap flex items-center space-x-1.5">
                                <Upload size={16} /> <span>Import Events</span>
                            </button>
                        </div>
                    )}

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text" placeholder="Search events..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 bg-gray-50 outline-none focus:border-slate-900"
                        />
                    </div>
                </div>
            </div>

            {/* Calendar Grid and Sidebar */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Main Calendar Grid */}
                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6 flex-1">
                    <div className="grid grid-cols-7 gap-2 text-center mb-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{d}</div>)}
                    </div>
                    {isLoading ? (
                        <div className="py-20 text-center text-gray-400 font-bold animate-pulse">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {emptyDays.map((_, i) => <div key={`e-${i}`} className="min-h-[5rem] bg-gray-50/30 rounded-2xl border border-dashed border-gray-100"></div>)}
                            {daysArray.map((day) => {
                                const isToday = day === todayNum && isCurrentMonth;
                                const dayEvents = eventsByDay[day] || [];

                                return (
                                    <div key={day} className={`min-h-[5.5rem] flex flex-col rounded-2xl border p-2 transition-all ${isToday ? 'border-slate-400 bg-slate-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
                                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 self-end'}`}>{day}</span>
                                        <div className="flex flex-wrap gap-1 mt-auto">
                                            {dayEvents.slice(0, 4).map((evt, idx) => (
                                                <div key={idx} title={evt.title} className={`w-2 h-2 rounded-full ${evt.theme.dot}`}></div>
                                            ))}
                                            {dayEvents.length > 4 && <span className="text-[8px] font-bold text-gray-400">+{dayEvents.length - 4}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Sidebar Summaries */}
                <div className="w-full lg:w-[350px] flex flex-col space-y-6">

                    {/* Today's Events Summary */}
                    <div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Today's Summary</h3>
                        <div className="space-y-3">
                            {todaysEvents.length === 0 ? (
                                <p className="text-sm text-gray-500 font-medium bg-white p-4 rounded-xl border border-gray-100">No events today.</p>
                            ) : todaysEvents.map((evt, i) => (
                                <div key={i} className={`p-3 rounded-xl border ${evt.theme.bg} ${evt.theme.border} flex items-center space-x-3`}>
                                    <div className={`w-2.5 h-2.5 rounded-full ${evt.theme.dot} shrink-0`}></div>
                                    <div><p className="text-sm font-bold text-gray-900">{evt.title}</p><p className="text-xs text-gray-600">{evt.subtitle}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Events List */}
                    <div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Upcoming Events</h3>
                        <div className="space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-sm text-gray-500 font-medium bg-white p-4 rounded-xl border border-gray-100">No upcoming events.</p>
                            ) : upcomingEvents.slice(0, 3).map((evt, i) => (
                                <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
                                    <div className="bg-gray-50 rounded-lg p-2 text-center w-12 border border-gray-100 shrink-0"><p className="text-[10px] font-bold text-gray-400">{evt.date.toLocaleString('default', { month: 'short' })}</p><p className="text-sm font-black text-gray-800">{evt.displayDay}</p></div>
                                    <div><p className="text-sm font-bold text-gray-900">{evt.title}</p><p className="text-xs text-gray-500">{evt.type}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personal Leaves Section for Employees */}
                    {role === "Employee" && (
                        <div>
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">My Leaves</h3>
                            <div className="space-y-3">
                                {myLeaves.length === 0 ? (
                                    <p className="text-sm text-gray-500 font-medium bg-white p-4 rounded-xl border border-gray-100">No leaves planned.</p>
                                ) : myLeaves.map((evt, i) => (
                                    <div key={i} className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center border-l-4 ${evt.theme.type === 'Medical' ? 'border-l-red-500' : 'border-l-orange-500'}`}>
                                        <p className="text-sm font-bold text-gray-900">{evt.date.getDate()} - {evt.endDate.getDate()} {monthName.split(' ')[0]}</p>
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Approved</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team or All Employee Leaves based on role */}
                    {(role === "Employee" || role === "Manager" || role === "HR") && (
                        <div>
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
                                {role === "HR" ? "All Employee Leaves" : "Team Leaves"}
                            </h3>
                            <div className="space-y-3">
                                {teamLeaves.length === 0 ? (
                                    <p className="text-sm text-gray-500 font-medium bg-white p-4 rounded-xl border border-gray-100">
                                        {role === "HR" ? "No employees on leave." : "Full team is available."}
                                    </p>
                                ) : teamLeaves.map((evt, i) => (
                                    <div key={i} className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3 border-l-4 ${evt.theme.type === 'Medical' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${evt.theme.type === 'Medical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {evt.title.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div><p className="text-sm font-bold text-gray-900">{evt.title}</p><p className="text-xs text-gray-500">{evt.date.getDate()} {monthName.split(' ')[0]}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- HOLIDAYS IMPORT MODAL --- */}
            {showHolidayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Import Holidays</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Upload an Excel (.xlsx, .xls) or CSV file</p>
                            </div>
                            <button onClick={() => setShowHolidayModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleHolidayImport}>
                            <div className="p-6 space-y-4">

                                {holidayStatus && (
                                    <div className={`p-3 rounded-xl border flex items-start space-x-2 ${holidayStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                        {holidayStatus.success ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                                        <p className="text-xs font-semibold">{holidayStatus.message}</p>
                                    </div>
                                )}

                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition relative">
                                    <Upload className="text-emerald-500 mb-2" size={24} />
                                    <p className="text-sm font-bold text-gray-700 mb-1">Click to upload file</p>
                                    <p className="text-xs text-gray-400 mb-3">Ensure columns: Name, Date, State</p>
                                    <input
                                        required
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={(e) => setHolidayFile(e.target.files ? e.target.files[0] : null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {holidayFile && (
                                        <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg w-full truncate">
                                            {holidayFile.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowHolidayModal(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100">Cancel</button>
                                <button type="submit" disabled={!holidayFile || isHolidayImporting} className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                                    {isHolidayImporting ? <span>Importing...</span> : <span>Upload & Save</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EVENTS IMPORT MODAL --- */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Import Events</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Upload an Excel (.xlsx, .xls) or CSV file</p>
                            </div>
                            <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleEventImport}>
                            <div className="p-6 space-y-4">

                                {eventStatus && (
                                    <div className={`p-3 rounded-xl border flex items-start space-x-2 ${eventStatus.success ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                        {eventStatus.success ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                                        <p className="text-xs font-semibold">{eventStatus.message}</p>
                                    </div>
                                )}

                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition relative">
                                    <Upload className="text-indigo-500 mb-2" size={24} />
                                    <p className="text-sm font-bold text-gray-700 mb-1">Click to upload file</p>
                                    <p className="text-xs text-gray-400 mb-3">Ensure columns: Title, Date, Location</p>
                                    <input
                                        required
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={(e) => setEventFile(e.target.files ? e.target.files[0] : null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {eventFile && (
                                        <div className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-lg w-full truncate">
                                            {eventFile.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100">Cancel</button>
                                <button type="submit" disabled={!eventFile || isEventImporting} className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                                    {isEventImporting ? <span>Importing...</span> : <span>Upload & Save</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}