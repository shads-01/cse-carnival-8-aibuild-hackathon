import { apiClient } from './api';
import { Announcement, CreateAnnouncementDto, UpdateAnnouncementDto } from '@shared/types';
import seedAnnouncements from '../../../data/announcements.json';

const STORAGE_KEY = 'campus_announcements_cache';

const getStoredAnnouncements = (): Announcement[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  const formatted: Announcement[] = (seedAnnouncements as any[]).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body || a.content || '',
    date: a.date || new Date().toISOString().split('T')[0],
    priority: (a.priority === 'urgent' ? 'high' : a.priority || 'medium') as Announcement['priority'],
    posted_by: a.posted_by || a.author || 'Admin Office',
    expires: a.expires || a.expires_at || '2026-12-31'
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
  return formatted;
};

const saveAnnouncements = (data: Announcement[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const announcementService = {
  getAll: async (): Promise<Announcement[]> => {
    try {
      const response = await apiClient.get('/announcements');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        saveAnnouncements(data);
        return data;
      }
    } catch (e) {
      // API fallback
    }
    return getStoredAnnouncements();
  },

  getById: async (id: string): Promise<Announcement> => {
    try {
      const response = await apiClient.get(`/announcements/${id}`);
      if (response.data?.data) return response.data.data;
    } catch (e) {
      // API fallback
    }
    const item = getStoredAnnouncements().find((a) => a.id === id);
    if (!item) throw new Error('Announcement not found');
    return item;
  },

  create: async (dto: CreateAnnouncementDto): Promise<Announcement> => {
    let created: Announcement | null = null;
    try {
      const response = await apiClient.post('/announcements', dto);
      created = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    if (!created) {
      created = {
        id: dto.id || `ann-${Date.now()}`,
        title: dto.title,
        body: dto.body,
        posted_by: dto.posted_by,
        priority: dto.priority || 'medium',
        date: dto.date || new Date().toISOString().split('T')[0],
        expires: dto.expires || '2026-12-31'
      };
    }

    const current = getStoredAnnouncements();
    saveAnnouncements([created, ...current]);
    return created;
  },

  update: async (id: string, dto: UpdateAnnouncementDto): Promise<Announcement> => {
    let updated: Announcement | null = null;
    try {
      const response = await apiClient.put(`/announcements/${id}`, dto);
      updated = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    const current = getStoredAnnouncements();
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Announcement not found');

    if (!updated) {
      updated = { ...current[index], ...dto } as Announcement;
    }

    current[index] = updated;
    saveAnnouncements([...current]);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/announcements/${id}`);
    } catch (e) {
      // fallback
    }
    const current = getStoredAnnouncements().filter((a) => a.id !== id);
    saveAnnouncements(current);
  }
};
