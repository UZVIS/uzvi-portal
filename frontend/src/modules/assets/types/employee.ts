export interface Employee {

    employee_id: string;

    name: string;

    designation: string | null;

    team_id: string | null;

    manager_id: string | null;

    join_date: string | null;

    access_tier: string;

    contact_details: string | null;

    employment_status: string;

}