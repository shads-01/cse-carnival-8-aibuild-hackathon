import { apiClient } from './api';
import { useNotificationStore } from '../store/notificationStore';
import { roomService } from './roomService';

export interface RoomBookingRequest {
  id: string;
  room_id: string;
  room_number: string;
  user_name: string;
  user_email: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: 'pending' | 'confirmed' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

const STORAGE_KEY = 'campus_booking_requests_cache';

const initialRequests: RoomBookingRequest[] = [
  {
    id: 'req-001',
    room_id: 'room-002',
    room_number: '7A03',
    user_name: 'Tasmia Rahman',
    user_email: 'tasmia@campus.edu',
    date: '2026-09-08',
    start_time: '14:00',
    end_time: '16:00',
    purpose: 'ACM ICPC Regional Team Mock Contest',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'req-002',
    room_id: 'room-006',
    room_number: '7B08',
    user_name: 'Tanvir Hossain',
    user_email: 'tanvir@campus.edu',
    date: '2026-09-09',
    start_time: '10:00',
    end_time: '12:00',
    purpose: 'Robotics Club Hardware Microcontroller Workshop',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'req-003',
    room_id: 'room-001',
    room_number: '7A01',
    user_name: 'Rahim Ahmed',
    user_email: 'student@campus.edu',
    date: '2026-09-05',
    start_time: '09:00',
    end_time: '11:00',
    purpose: 'Senior Design Project Presentation Rehearsal',
    status: 'confirmed',
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString()
  }
];

const getStoredRequests = (): RoomBookingRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRequests));
  return initialRequests;
};

const saveRequests = (data: RoomBookingRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const requestService = {
  getAll: async (): Promise<RoomBookingRequest[]> => {
    try {
      const response = await apiClient.get('/requests');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        saveRequests(data);
        return data;
      }
    } catch (e) {
      // API fallback
    }
    return getStoredRequests();
  },

  approve: async (id: string): Promise<RoomBookingRequest> => {
    let approved: RoomBookingRequest | null = null;
    try {
      const response = await apiClient.post(`/requests/${id}/approve`);
      approved = response.data?.data || response.data;
    } catch (e) {
      // API fallback
    }

    const current = getStoredRequests();
    const index = current.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Request not found');

    const req = current[index];
    approved = {
      ...req,
      status: 'confirmed'
    };
    current[index] = approved;
    saveRequests([...current]);

    // Also register booking in roomService
    try {
      await roomService.bookRoom(req.room_id, {
        booked_by: req.user_name,
        date: req.date,
        start_time: req.start_time,
        end_time: req.end_time,
        purpose: req.purpose
      });
    } catch (e) {
      // continue
    }

    // Trigger notification
    useNotificationStore.getState().addNotification({
      title: 'Booking Approved',
      message: `Reservation for room ${req.room_number} on ${req.date} (${req.start_time}-${req.end_time}) was confirmed.`,
      type: 'booking_approved',
      link: '/app/activity'
    });

    return approved;
  },

  reject: async (id: string, reason?: string): Promise<RoomBookingRequest> => {
    let rejected: RoomBookingRequest | null = null;
    try {
      const response = await apiClient.post(`/requests/${id}/reject`, { reason });
      rejected = response.data?.data || response.data;
    } catch (e) {
      // API fallback
    }

    const current = getStoredRequests();
    const index = current.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Request not found');

    const req = current[index];
    rejected = {
      ...req,
      status: 'rejected',
      rejection_reason: reason || 'Facility unavailable during requested slot'
    };
    current[index] = rejected;
    saveRequests([...current]);

    // Trigger notification
    useNotificationStore.getState().addNotification({
      title: 'Booking Request Rejected',
      message: `Reservation for room ${req.room_number} was rejected: ${rejected.rejection_reason}`,
      type: 'booking_rejected',
      link: '/app/activity'
    });

    return rejected;
  },

  create: async (request: Omit<RoomBookingRequest, 'id' | 'status' | 'created_at'>): Promise<RoomBookingRequest> => {
    let created: RoomBookingRequest | null = null;
    try {
      const response = await apiClient.post('/requests', request);
      created = response.data?.data || response.data;
    } catch (e) {
      // API fallback
    }

    if (!created) {
      created = {
        ...request,
        id: `req-${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    }

    const current = getStoredRequests();
    saveRequests([created, ...current]);
    return created;
  }
};
