import { useState, useEffect } from 'react';
import { calendarApi } from '../api';
import { THEMES } from '../types';

export const useCalendar = (role: string) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [selectedTeam, setSelectedTeam] = useState("All");
    const [selectedState, setSelectedState] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const loggedInEmployeeId = "EMP123";

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [holidaysData, eventsData, leavesData] = await Promise.all([
                    calendarApi.fetchHolidays(),
                    calendarApi.fetchEvents(),
                    calendarApi.fetchLeaves()
                ]);

                const combinedItems: any[] = [];

                if (Array.isArray(holidaysData)) {
                    holidaysData.forEach((h: any) => combinedItems.push({
                        id: `hol-${h.holiday_id}`, date: new Date(h.date), endDate: new Date(h.date),
                        title: h.name, subtitle: h.state || 'National', type: "Holiday",
                        theme: THEMES.HOLIDAY, isCompanyWide: true, searchStr: `${h.name} ${h.state || 'National'}`.toLowerCase()
                    }));
                }

                if (Array.isArray(eventsData)) {
                    eventsData.forEach((e: any) => combinedItems.push({
                        id: `evt-${e.event_id}`, date: new Date(e.date), endDate: new Date(e.date),
                        title: e.title, subtitle: e.location || 'Company-wide', type: "Event",
                        theme: THEMES.EVENT, isCompanyWide: true, searchStr: `${e.title} ${e.location}`.toLowerCase()
                    }));
                }

                if (Array.isArray(leavesData)) {
                    leavesData.filter((l: any) => l.status?.toUpperCase() === "APPROVED").forEach((l: any) => {
                        const isMine = l.employee_id === loggedInEmployeeId;
                        const isMedical = l.leave_type === "Medical Leave";
                        let leaveTheme = isMine ? THEMES.MY_LEAVE : THEMES.TEAM_LEAVE;
                        let leaveTitle = isMine ? "Your Leave" : `${l.employee_id}`;

                        if (isMedical) {
                            if (role === "HR" || isMine) {
                                leaveTheme = THEMES.MEDICAL_LEAVE;
                                leaveTitle = isMine ? "Your Medical Leave" : `${l.employee_id} (Medical)`;
                            } else {
                                leaveTitle = `${l.employee_id} (Leave)`;
                            }
                        }

                        combinedItems.push({
                            id: `leave-${l.application_id}`, date: new Date(l.start_date), endDate: new Date(l.end_date),
                            title: leaveTitle, subtitle: `${l.team || "Engineering"} Absence`, type: "Leave",
                            theme: leaveTheme, team: l.team || "Engineering",
                            isCompanyWide: false, searchStr: `${l.employee_id} ${l.team || "Engineering"}`.toLowerCase(), isMine
                        });
                    });
                }
                setCalendarData(combinedItems);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [role, refreshTrigger]);

    const filteredData = calendarData.filter(item => {
        const matchesTeam = selectedTeam === "All" || item.isCompanyWide || item.team === selectedTeam;
        const matchesState = selectedState === "All" || item.type !== "Holiday" || item.subtitle === selectedState;
        const matchesType = selectedType === "All" || item.type === selectedType;
        const matchesSearch = searchQuery === "" || item.searchStr.includes(searchQuery.toLowerCase());
        return matchesTeam && matchesState && matchesType && matchesSearch;
    });

    const refresh = () => setRefreshTrigger(prev => prev + 1);

    return {
        currentDate, setCurrentDate,
        isLoading, filteredData,
        selectedTeam, setSelectedTeam,
        selectedState, setSelectedState,
        selectedType, setSelectedType,
        searchQuery, setSearchQuery,
        refresh
    };
};