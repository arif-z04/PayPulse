import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { SystemNotification } from '@/types';
import { mockDb, delay } from '@/mocks/mockDb';

export const notificationService = {
  async getNotifications(): Promise<SystemNotification[]> {
    if (config.enableMockApi) {
      await delay(100);
      return mockDb.getNotifications();
    }
    return apiClient.get<SystemNotification[]>('/notifications');
  },

  async markAsRead(id: string): Promise<void> {
    if (config.enableMockApi) {
      await delay(50);
      const list = mockDb.getNotifications();
      const item = list.find((n) => n.id === id);
      if (item) item.isRead = true;
      mockDb.saveNotifications(list);
      return;
    }
    return apiClient.post(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    if (config.enableMockApi) {
      await delay(50);
      const list = mockDb.getNotifications();
      list.forEach((n) => (n.isRead = true));
      mockDb.saveNotifications(list);
      return;
    }
    return apiClient.post('/notifications/read-all');
  },
};
