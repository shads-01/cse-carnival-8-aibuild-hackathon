import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'booking_approved' | 'booking_rejected' | 'announcement' | 'assignment' | 'event' | 'system';
  read: boolean;
  created_at: string;
  link?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: Omit<NotificationItem, 'id' | 'created_at' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'campus_notifications_cache';

const getStoredNotifications = (): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore corrupt cache
  }
  return [];
};

const persist = (notifications: NotificationItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    // storage unavailable — notifications still work for this session
  }
};

const initialNotifications = getStoredNotifications();

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  unreadCount: initialNotifications.filter((n) => !n.read).length,

  addNotification: (item) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
      read: false
    };
    set((state) => {
      const updated = [newNotif, ...state.notifications];
      persist(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length
      };
    });
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      persist(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      persist(updated);
      return { notifications: updated, unreadCount: 0 };
    });
  },

  clearAll: () => {
    persist([]);
    set({ notifications: [], unreadCount: 0 });
  }
}));
