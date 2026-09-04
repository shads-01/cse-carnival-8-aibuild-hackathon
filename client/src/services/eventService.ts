import { apiClient } from './api';
import { Event, CreateEventDto, UpdateEventDto, EventRegistration } from '@shared/types';
import seedEvents from '../../../data/events.json';

const STORAGE_KEY = 'campus_events_cache';

const getStoredEvents = (): Event[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  const formatted: Event[] = (seedEvents as any[]).map((e) => ({
    id: e.id,
    name: e.name || e.title || '',
    description: e.description || '',
    date: e.date,
    start_time: e.start_time,
    end_time: e.end_time,
    end_date: e.end_date || e.date,
    venue: e.venue || e.location || 'Campus Auditorium',
    organizer: e.organizer,
    capacity: Number(e.capacity || 100),
    registered: Number(e.registered || e.registered_count || 0),
    status: (e.status || 'upcoming') as Event['status'],
    registrations: []
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
  return formatted;
};

const saveEvents = (data: Event[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const eventService = {
  getAll: async (): Promise<Event[]> => {
    try {
      const response = await apiClient.get('/events');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        saveEvents(data);
        return data;
      }
    } catch (e) {
      // API fallback
    }
    return getStoredEvents();
  },

  getById: async (id: string): Promise<Event> => {
    try {
      const response = await apiClient.get(`/events/${id}`);
      if (response.data?.data) return response.data.data;
    } catch (e) {
      // API fallback
    }
    const item = getStoredEvents().find((e) => e.id === id);
    if (!item) throw new Error('Event not found');
    return item;
  },

  create: async (dto: CreateEventDto): Promise<Event> => {
    let created: Event | null = null;
    try {
      const response = await apiClient.post('/events', dto);
      created = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    if (!created) {
      created = {
        id: dto.id || `evt-${Date.now()}`,
        name: dto.name,
        description: dto.description || '',
        date: dto.date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        end_date: dto.end_date || dto.date,
        venue: dto.venue,
        organizer: dto.organizer,
        capacity: Number(dto.capacity),
        registered: 0,
        status: dto.status || 'upcoming',
        registrations: []
      };
    }

    const current = getStoredEvents();
    saveEvents([created, ...current]);
    return created;
  },

  update: async (id: string, dto: UpdateEventDto): Promise<Event> => {
    let updated: Event | null = null;
    try {
      const response = await apiClient.put(`/events/${id}`, dto);
      updated = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    const current = getStoredEvents();
    const index = current.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');

    if (!updated) {
      updated = {
        ...current[index],
        ...dto,
        capacity: dto.capacity !== undefined ? Number(dto.capacity) : current[index].capacity
      } as Event;
    }

    current[index] = updated;
    saveEvents([...current]);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/events/${id}`);
    } catch (e) {
      // fallback
    }
    const current = getStoredEvents().filter((e) => e.id !== id);
    saveEvents(current);
  },

  register: async (eventId: string, studentName: string, studentEmail: string): Promise<EventRegistration> => {
    let registration: EventRegistration | null = null;
    try {
      const response = await apiClient.post(`/events/${eventId}/register`, {
        name: studentName,
        student_id: studentEmail
      });
      registration = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    if (!registration) {
      registration = {
        id: `reg-${Date.now()}`,
        event_id: eventId,
        student_id: studentEmail,
        name: studentName,
        registered_at: new Date().toISOString()
      };
    }

    const current = getStoredEvents();
    const index = current.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      const evt = current[index];
      const regs = evt.registrations || [];
      if (!regs.some((r: EventRegistration) => r.student_id === studentEmail)) {
        current[index] = {
          ...evt,
          registered: (evt.registered || 0) + 1,
          registrations: [...regs, registration]
        };
        saveEvents([...current]);
      }
    }

    return registration;
  },

  cancelRegistration: async (eventId: string, registrationId: string): Promise<void> => {
    try {
      await apiClient.delete(`/events/${eventId}/registrations/${registrationId}`);
    } catch (e) {
      // fallback
    }

    const current = getStoredEvents();
    const index = current.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      const evt = current[index];
      const regs = (evt.registrations || []).filter((r: EventRegistration) => r.id !== registrationId);
      current[index] = {
        ...evt,
        registered: Math.max(0, (evt.registered || 0) - 1),
        registrations: regs
      };
      saveEvents([...current]);
    }
  }
};
