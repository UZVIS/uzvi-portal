export type TargetType = "company_wide" | "team" | "role";
export type AnnouncementStatus = "active" | "archived";

export interface Announcement {
  announcement_id: string;
  posted_by: string;
  title: string;
  body: string;
  target_type: TargetType;
  target_value: string | null;
  requires_ack: boolean;
  expiry_date: string | null;
  status: AnnouncementStatus;
  posted_at: string;
}

export interface AcknowledgmentStatusRow {
  employee_id: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
}