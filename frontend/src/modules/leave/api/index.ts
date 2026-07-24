import { apiGet, apiPost } from '../../../api/client';

const BASE_URL = 'http://127.0.0.1:8000/api';
const V1_LEAVE = `${BASE_URL}/v1/leave`;

export const leaveApi = {
    // GET Requests
    getLeaveTypes: () => apiGet('/v1/leave/leave-types').catch(() => fetch(`${V1_LEAVE}/leave-types`).then(r => r.json())),
    getAllApplications: () => apiGet('/v1/leave/applications').catch(() => fetch(`${V1_LEAVE}/applications`).then(r => r.json())),
    getLeaveBalances: (employeeId: string) => apiGet(`/v1/leave/leave-balances/${employeeId}`),

    // POST Requests
    applyLeave: (payload: any) => apiPost('/v1/leave/applications', payload),
    createLeaveType: (payload: any) => fetch(`${BASE_URL}/leave-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }),
    allocateBalance: (payload: any) => fetch(`${V1_LEAVE}/leave-balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }),

    // PUT Requests (Status Updates)
    updateStatus: (id: string, payload: any) => fetch(`${V1_LEAVE}/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(async (res) => {
        if (!res.ok) throw await res.json();
        return res;
    })
};