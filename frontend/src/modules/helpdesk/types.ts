export interface TicketComment {
  comment_id: number;
  ticket_id: number;
  author_id: string;
  comment: string;
  created_at: string;
}

export interface Ticket {
  ticket_id: number;
  raised_by: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  comments: TicketComment[];
}

export interface TicketCreate {
  raised_by: string;
  category: string;
  priority: string;
  description: string;
  assigned_to?: string | null;
}

export interface TicketStatusUpdate {
  status: string;
}

export interface TicketComment {
  comment_id: number;
  ticket_id: number;
  author_id: string;
  comment: string;
  created_at: string;
}

export interface TicketCommentCreate {
  author_id: string;
  comment: string;
}