// Attendance Status
export type AttendanceStatus =
  | "in-office"
  | "wfh"
  | "on-leave"
  | "absent";


// Attendance Record (Backend Response)
export interface Attendance {
  id: number;
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in?: string;
  check_out?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}


// Create / Update Request
export interface AttendanceFormData {
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in?: string;
  check_out?: string;
  source?: string;
}


// Filter Params
export interface AttendanceFilter {
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  status?: AttendanceStatus;
}


// Monthly Summary Response
export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  wfh_days: number;
  leave_days: number;
  absent_days: number;
}


// Team Attendance Response
export interface TeamAttendance {
  employee_id: string;
  employee_name: string;
  designation?: string;
  department?: string;
  status: AttendanceStatus;
  check_in?: string;
  check_out?: string;
}


// Unexplained Absence Response
export interface UnexplainedAbsence {
  employee_id: string;
  employee_name: string;
  department?: string;
  start_date: string;
  end_date: string;
  days: number;
}


export interface AttendanceMarkRequest {
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in?: string;
  check_out?: string;
  source?: string;
}

export type AttendanceRecord = Attendance;