import type { HolidayForm, EventForm } from "../types";
import { apiGet } from '../../../api/client';

export const calendarApi = {
    fetchHolidays: () => fetch('http://127.0.0.1:8000/api/v1/calendar/holidays').then(res => res.json()).catch(() => []),
    fetchEvents: () => fetch('http://127.0.0.1:8000/api/v1/calendar/events').then(res => res.json()).catch(() => []),

    // 🌟 ఇప్పుడు నీ క్లైంట్ నుంచి apiGet వాడుతున్నాం
    fetchLeaves: () => apiGet('/v1/leave/applications').catch(() => []),

    addHoliday: (data: HolidayForm) => fetch('http://127.0.0.1:8000/api/v1/calendar/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    addEvent: (data: EventForm) => fetch('http://127.0.0.1:8000/api/v1/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
};