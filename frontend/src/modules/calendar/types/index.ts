export interface HolidayForm {
    name: string;
    date: string;
    state: string;
}

export interface EventForm {
    title: string;
    date: string;
    location: string;
}

export const THEMES = {
    HOLIDAY: { type: "Holiday", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: "🟢" },
    EVENT: { type: "Event", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500", icon: "🔵" },
    MY_LEAVE: { type: "Your Leave", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", icon: "🟠" },
    TEAM_LEAVE: { type: "Team Leave", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", icon: "👥" },
    MEDICAL_LEAVE: { type: "Medical", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", icon: "🏥" },
};