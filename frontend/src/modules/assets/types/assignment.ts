export interface AssetAssignment {
  assignment_id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  returned_date: string | null;
  remarks: string | null;
}

export interface AssetAssignmentCreate {
  assignment_id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  returned_date?: string | null;
  remarks?: string | null;
}

export interface AssetReturn {
  returned_date: string;
  remarks?: string | null;
}