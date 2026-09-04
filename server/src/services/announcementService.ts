import { supabase } from '../config/supabase';
import {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementFilterDto
} from '@shared/types';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class AnnouncementService {
  async list(filter?: AnnouncementFilterDto): Promise<Announcement[]> {
    try {
      let query = supabase.from('announcements').select('*');

      if (filter) {
        if (filter.priority) {
          query = query.eq('priority', filter.priority);
        }
        if (filter.posted_by) {
          query = query.ilike('posted_by', `%${filter.posted_by}%`);
        }
        if (filter.unexpired_only) {
          const today = new Date().toISOString().split('T')[0];
          query = query.gte('expires', today);
        }
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching announcements:', error.message);
        throw ApiError.internal(`Failed to fetch announcements: ${error.message}`);
      }

      return (data || []) as Announcement[];
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal('Failed to fetch announcements');
    }
  }

  async getById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching announcement with id ${id}:`, error.message);
      throw ApiError.internal(`Failed to fetch announcement: ${error.message}`);
    }

    return (data as Announcement) || null;
  }

  async create(dto: CreateAnnouncementDto): Promise<Announcement> {
    const id = dto.id || `ann-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      id,
      title: dto.title,
      body: dto.body,
      date: dto.date || today,
      priority: dto.priority,
      posted_by: dto.posted_by,
      expires: dto.expires
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error('Error creating announcement:', error.message);
      throw ApiError.badRequest(`Failed to create announcement: ${error.message}`);
    }

    return data as Announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto): Promise<Announcement> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Announcement with ID ${id} not found`);
    }

    const { data, error } = await supabase
      .from('announcements')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating announcement ${id}:`, error.message);
      throw ApiError.badRequest(`Failed to update announcement: ${error.message}`);
    }

    return data as Announcement;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Announcement with ID ${id} not found`);
    }

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      logger.error(`Error deleting announcement ${id}:`, error.message);
      throw ApiError.internal(`Failed to delete announcement: ${error.message}`);
    }

    return true;
  }
}

export const announcementService = new AnnouncementService();
