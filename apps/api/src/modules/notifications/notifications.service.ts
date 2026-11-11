import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { NotificationItem } from '@paiementbj/types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notificationsByUser = new Map<string, NotificationItem[]>();

  async notifyUser(
    userId: string,
    input: {
      title: string;
      body: string;
      type: NotificationItem['type'];
      resourceId?: string;
    }
  ): Promise<NotificationItem> {
    const item: NotificationItem = {
      id: `notif_${crypto.randomUUID()}`,
      userId,
      title: input.title,
      body: input.body,
      type: input.type,
      isRead: false,
      resourceId: input.resourceId,
      createdAt: new Date().toISOString(),
    };

    const existing = this.notificationsByUser.get(userId) || [];
    this.notificationsByUser.set(userId, [item, ...existing].slice(0, 100));
    this.logger.log(`[NOTIFICATION] user=${userId} type=${input.type} title="${input.title}"`);
    return item;
  }

  async listUserNotifications(userId: string): Promise<NotificationItem[]> {
    return this.notificationsByUser.get(userId) || [];
  }

  async markAsRead(userId: string, notificationId: string): Promise<{ success: boolean }> {
    const items = this.notificationsByUser.get(userId) || [];
    const target = items.find((n) => n.id === notificationId);
    if (!target) {
      throw new NotFoundException('Notification introuvable.');
    }
    target.isRead = true;
    return { success: true };
  }
}
