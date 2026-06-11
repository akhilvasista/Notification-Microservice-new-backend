import { InAppNotification } from '../models/InAppNotification';

export interface CreateInAppNotificationDto {
  userId: string;
  event: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export class InAppNotificationService {
  async create(data: CreateInAppNotificationDto) {
    return InAppNotification.create({
      userId: data.userId,
      event: data.event,
      title: data.title,
      body: data.body,
      type: data.type,
      metadata: data.metadata || {},
      isRead: false,
    });
  }

  async getUserNotifications(userId: string) {
    return InAppNotification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async markAsRead(notificationId: string) {
    return InAppNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string) {
    return InAppNotification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId: string) {
    return InAppNotification.countDocuments({
      userId,
      isRead: false,
    });
  }
}