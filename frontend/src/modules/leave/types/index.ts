export interface LeaveType {
    leave_type_id: string;
    name: string;
    accrual_method: string;
    carry_forward_limit: number;
    doc_required_threshold: number;
}

export interface LeaveApplication {
    application_id: string;
    employee_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    team?: string;
    leave_type?: string;
}

export interface LeaveBalance {
    employee_id: string;
    leave_type_id: string;
    balance: number;
    year: number;
}