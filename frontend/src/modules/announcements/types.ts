export interface Announcement {
  announcement_id: number;
  posted_by: string;
  title: string;
  body: string;
  target_type: string;
  target_value?: string | null;
  requires_acknowledgement: boolean;
  expiry_date?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementCreate {
  posted_by: string;
  title: string;
  body: string;
  target_type: string;
  target_value?: string | null;
  requires_acknowledgement: boolean;
  expiry_date?: string | null;
}

export interface AnnouncementUpdate {
  title?: string;
  body?: string;
  target_type?: string;
  target_value?: string | null;
  requires_acknowledgement?: boolean;
  expiry_date?: string | null;
  archived?: boolean;
}

export interface AnnouncementAck {
  employee_id: string;
}

export interface DashboardSummary {
  total: number;
  active: number;
  archived: number;
  requires_acknowledgement: number;
}

export interface PaginatedAnnouncements {
  page: number;
  size: number;
  total: number;
  items: Announcement[];
}