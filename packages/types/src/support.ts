export type TicketStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export type TicketCategory =
  | 'DEBITED_NOT_CREDITED'
  | 'INCORRECT_AMOUNT'
  | 'REFERENCE_ERROR'
  | 'RECEIPT_NOT_GENERATED'
  | 'TECHNICAL_DIFFICULTY'
  | 'OTHER';

export interface SupportMessage {
  id: string;
  senderType: 'USER' | 'AGENT' | 'SYSTEM';
  senderName: string;
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // "TK-2026-XXXX"
  userId: string;
  transactionId?: string;
  category: TicketCategory;
  categoryLabel: string;
  title: string;
  description: string;
  status: TicketStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  messages: SupportMessage[];
}
