import { supabase } from '../config/supabase';
import { Schedule, CreateScheduleDto, UpdateScheduleDto, ScheduleFilterDto } from '@shared/types';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class ScheduleService {
  async list(filter?: ScheduleFilterDto): Promise<Schedule[]> {
    try {
      let query = supabase.from('schedules').select('*');

      if (filter) {
        if (filter.course) {
          query = query.ilike('course', `%${filter.course}%`);
        }
        if (filter.day) {
          query = query.eq('day', filter.day);
        }
        if (filter.room) {
          query = query.eq('room', filter.room);
        }
        if (filter.instructor) {
          query = query.ilike('instructor', `%${filter.instructor}%`);
        }
        if (filter.section) {
          query = query.eq('section', filter.section);
        }
      }

      query = query.order('day', { ascending: true }).order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching schedules:', error.message);
        throw ApiError.internal(`Failed to fetch schedules: ${error.message}`);
      }

      return (data || []) as Schedule[];
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal('Failed to fetch schedules');
    }
  }

  async getById(id: string): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching schedule with id ${id}:`, error.message);
      throw ApiError.internal(`Failed to fetch schedule: ${error.message}`);
    }

    return (data as Schedule) || null;
  }

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    const id = dto.id || `sch-${Date.now()}`;
    const payload = {
      id,
      course: dto.course,
      title: dto.title,
      day: dto.day,
      start_time: dto.start_time,
      end_time: dto.end_time,
      room: dto.room,
      instructor: dto.instructor || 'TBA',
      section: dto.section
    };

    const { data, error } = await supabase
      .from('schedules')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error('Error creating schedule:', error.message);
      throw ApiError.badRequest(`Failed to create schedule: ${error.message}`);
    }

    return data as Schedule;
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Schedule with ID ${id} not found`);
    }

    const { data, error } = await supabase
      .from('schedules')
      .update(dto)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Error updating schedule ${id}:`, error.message);
      throw ApiError.badRequest(`Failed to update schedule: ${error.message}`);
    }

    const updated = data || (await this.getById(id));
    return updated as Schedule;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Schedule with ID ${id} not found`);
    }

    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) {
      logger.error(`Error deleting schedule ${id}:`, error.message);
      throw ApiError.internal(`Failed to delete schedule: ${error.message}`);
    }

    return true;
  }
}

export const scheduleService = new ScheduleService();
