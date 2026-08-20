export interface TrainingProgram {
  program_id: number;
  name: string;
}

export interface TrainingProgramCreate {
  name: string;
}

export interface TrainingUnit {
  unit_id: number;
  program_id: number;
  name: string;
  sequence: number;
}

export interface TrainingUnitCreate {
  name: string;
  sequence: number;
}

export interface Enrollment {
  enrollment_id: number;
  employee_id: string;
  employee_name?: string | null;
  program_id: number;
  enrolled_at: string;
}

export interface EnrollmentCreate {
  employee_id: string;
  program_id: number;
}

export interface UnitCompletion {
  completion_id: number;
  enrollment_id: number;
  unit_id: number;
  completed_at: string;
}

export interface UnitCompletionCreate {
  enrollment_id: number;
  unit_id: number;
}

export interface Progress {
  employee_id: string;
  employee_name?: string | null;
  completed_units: number;
  total_units: number;
  completion_percentage: number;
}

export interface LaggingEnrollee {
  employee_id: string;
  employee_name?: string | null;
  completion_percentage: number;
  points_behind_average: number;
}

export interface CohortProgress {
  program_id: number;
  program_name: string;
  total_enrollments: number;
  completed_enrollments: number;
  average_completion_percentage: number;
  lagging_employees: LaggingEnrollee[];
}