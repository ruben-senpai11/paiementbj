export interface AuditLog {
  id: string;
  actorId: string;
  actorType: 'USER' | 'ADMIN' | 'SYSTEM' | 'PROVIDER';
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
