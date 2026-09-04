import { apiClient } from './api';
import { Room, CreateRoomDto, UpdateRoomDto, Booking, RoomType, RoomStatus } from '@shared/types';
import seedRooms from '../../../data/rooms.json';

const STORAGE_KEY = 'campus_rooms_cache';

const getStoredRooms = (): Room[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  const formatted: Room[] = (seedRooms as any[]).map((r) => ({
    id: r.id,
    room_number: r.room_number,
    type: (r.type || 'classroom') as RoomType,
    capacity: Number(r.capacity || 40),
    equipment: r.equipment || [],
    floor: Number(r.floor || 1),
    status: (r.status || 'available') as RoomStatus,
    bookings: (r.bookings || []).map((b: any, idx: number) => ({
      id: b.booking_id || b.id || `bk-${r.id}-${idx}`,
      room_id: r.id,
      booked_by: b.booked_by,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      purpose: b.purpose,
      created_at: new Date().toISOString()
    }))
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
  return formatted;
};

const saveRooms = (data: Room[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const roomService = {
  getAll: async (): Promise<Room[]> => {
    try {
      const response = await apiClient.get('/rooms');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        saveRooms(data);
        return data;
      }
    } catch (e) {
      // API fallback
    }
    return getStoredRooms();
  },

  getById: async (id: string): Promise<Room> => {
    try {
      const response = await apiClient.get(`/rooms/${id}`);
      if (response.data?.data) return response.data.data;
    } catch (e) {
      // API fallback
    }
    const item = getStoredRooms().find((r) => r.id === id);
    if (!item) throw new Error('Room not found');
    return item;
  },

  create: async (dto: CreateRoomDto): Promise<Room> => {
    let created: Room | null = null;
    try {
      const response = await apiClient.post('/rooms', dto);
      created = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    if (!created) {
      created = {
        id: dto.id || `room-${Date.now()}`,
        room_number: dto.room_number,
        type: dto.type,
        capacity: Number(dto.capacity),
        equipment: dto.equipment || [],
        floor: Number(dto.floor),
        status: dto.status || 'available',
        bookings: []
      };
    }

    const current = getStoredRooms();
    saveRooms([created, ...current]);
    return created;
  },

  update: async (id: string, dto: UpdateRoomDto): Promise<Room> => {
    let updated: Room | null = null;
    try {
      const response = await apiClient.put(`/rooms/${id}`, dto);
      updated = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    const current = getStoredRooms();
    const index = current.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Room not found');

    if (!updated) {
      updated = {
        ...current[index],
        ...dto,
        capacity: dto.capacity !== undefined ? Number(dto.capacity) : current[index].capacity,
        floor: dto.floor !== undefined ? Number(dto.floor) : current[index].floor
      } as Room;
    }

    current[index] = updated;
    saveRooms([...current]);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/rooms/${id}`);
    } catch (e) {
      // fallback
    }
    const current = getStoredRooms().filter((r) => r.id !== id);
    saveRooms(current);
  },

  bookRoom: async (roomId: string, booking: Omit<Booking, 'id' | 'room_id'>): Promise<Booking> => {
    let createdBooking: Booking | null = null;
    try {
      const response = await apiClient.post(`/rooms/${roomId}/bookings`, booking);
      createdBooking = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    if (!createdBooking) {
      createdBooking = {
        id: `bk-${Date.now()}`,
        room_id: roomId,
        ...booking,
        created_at: new Date().toISOString()
      };
    }

    const current = getStoredRooms();
    const index = current.findIndex((r) => r.id === roomId);
    if (index !== -1) {
      const room = current[index];
      const bookings = room.bookings || [];
      current[index] = {
        ...room,
        bookings: [...bookings, createdBooking]
      };
      saveRooms([...current]);
    }

    return createdBooking;
  }
};
