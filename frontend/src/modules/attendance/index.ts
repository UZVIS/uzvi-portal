// src/modules/attendance/index.ts

export { default as AttendanceModulePage } from './AttendanceModulePage';
export { default as AttendanceForm } from './components/AttendanceForm';
export { default as AttendanceTable } from './components/AttendanceTable';
export { default as AttendanceSummary } from './components/AttendanceSummary';
export { default as UnexplainedAbsences } from './components/UnexplainedAbsences';
export { default as AttendanceModal } from './components/AttendanceModal';
export { default as EmployeeAttendance } from './components/EmployeeAttendance';
export { default as TeamAttendance } from './components/TeamAttendance';
export { useAttendance, useTeamAttendance } from './hooks/useAttendance';
export * from './types';