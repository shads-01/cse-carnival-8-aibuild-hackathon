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

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Room Booking Confirmed',
    message: 'Your booking for Lab 401 on Friday 10:00 AM has been approved by admin.',
    type: 'booking_approved',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    link: '/app/activity'
  },
  {
    id: 'notif-2',
    title: 'New High Priority Announcement',
    message: 'Midterm Examination Schedule for CSE 8th Semester has been published.',
    type: 'announcement',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    link: '/app/announcements'
  },
  {
    id: 'notif-3',
    title: 'Upcoming Assignment Due',
    message: 'Distributed Systems Project Milestone 2 is due in 24 hours.',
    type: 'assignment',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    link: '/app/assignments'
  }
];

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
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 })
}));
