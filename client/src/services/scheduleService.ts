import { apiClient } from './api';
import { Schedule, CreateScheduleDto, UpdateScheduleDto } from '@shared/types';
import seedSchedules from '../../../data/schedules.json';

const STORAGE_KEY = 'campus_schedules_cache';

const getStoredSchedules = (): Schedule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSchedules));
  return seedSchedules as Schedule[];
};

const saveSchedules = (data: Schedule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const scheduleService = {
  getAll: async (): Promise<Schedule[]> => {
    try {
      const response = await apiClient.get('/schedules');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        saveSchedules(data);
        return data;
      }
    } catch (e) {
      // API fallback
    }
    return getStoredSchedules();
  },

  getById: async (id: string): Promise<Schedule> => {
    try {
      const response = await apiClient.get(`/schedules/${id}`);
      if (response.data?.data) return response.data.data;
    } catch (e) {
      // API fallback
    }
    const item = getStoredSchedules().find((s) => s.id === id);
    if (!item) throw new Error('Schedule not found');
    return item;
  },

  create: async (dto: CreateScheduleDto): Promise<Schedule> => {
    let created: Schedule | null = null;
    try {
      const response = await apiClient.post('/schedules', dto);
      created = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    if (!created) {
      created = {
        id: dto.id || `sch-${Date.now()}`,
        course: dto.course,
        title: dto.title,
        day: dto.day,
        start_time: dto.start_time,
        end_time: dto.end_time,
        room: dto.room,
        instructor: dto.instructor || 'Staff',
        section: dto.section
      };
    }

    const current = getStoredSchedules();
    saveSchedules([created, ...current]);
    return created;
  },

  update: async (id: string, dto: UpdateScheduleDto): Promise<Schedule> => {
    let updated: Schedule | null = null;
    try {
      const response = await apiClient.put(`/schedules/${id}`, dto);
      updated = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    const current = getStoredSchedules();
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Schedule not found');

    if (!updated) {
      updated = { ...current[index], ...dto };
    }

    current[index] = updated;
    saveSchedules([...current]);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/schedules/${id}`);
    } catch (e) {
      // fallback
    }
    const current = getStoredSchedules().filter((s) => s.id !== id);
    saveSchedules(current);
  }
};
