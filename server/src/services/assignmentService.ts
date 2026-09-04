import { supabase } from '../config/supabase';
import {
  Assignment,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentFilterDto
} from '@shared/types';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class AssignmentService {
  async list(filter?: AssignmentFilterDto): Promise<Assignment[]> {
    try {
      let query = supabase.from('assignments').select('*');

      if (filter) {
        if (filter.course) {
          query = query.ilike('course', `%${filter.course}%`);
        }
        if (filter.status) {
          query = query.eq('status', filter.status);
        }
      }

      query = query.order('deadline', { ascending: true });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching assignments:', error.message);
        throw ApiError.internal(`Failed to fetch assignments: ${error.message}`);
      }

      return (data || []) as Assignment[];
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal('Failed to fetch assignments');
    }
  }

  async getById(id: string): Promise<Assignment | null> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching assignment with id ${id}:`, error.message);
      throw ApiError.internal(`Failed to fetch assignment: ${error.message}`);
    }

    return (data as Assignment) || null;
  }

  async create(dto: CreateAssignmentDto): Promise<Assignment> {
    const id = dto.id || `asgn-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      id,
      course: dto.course,
      course_title: dto.course_title,
      title: dto.title,
      description: dto.description || '',
      assigned_date: dto.assigned_date || today,
      deadline: dto.deadline,
      submission_platform: dto.submission_platform,
      status: dto.status || 'pending',
      marks: dto.marks
    };

    const { data, error } = await supabase
      .from('assignments')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error('Error creating assignment:', error.message);
      throw ApiError.badRequest(`Failed to create assignment: ${error.message}`);
    }

    return data as Assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto): Promise<Assignment> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Assignment with ID ${id} not found`);
    }

    const { data, error } = await supabase
      .from('assignments')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating assignment ${id}:`, error.message);
      throw ApiError.badRequest(`Failed to update assignment: ${error.message}`);
    }

    return data as Assignment;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Assignment with ID ${id} not found`);
    }

    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) {
      logger.error(`Error deleting assignment ${id}:`, error.message);
      throw ApiError.internal(`Failed to delete assignment: ${error.message}`);
    }

    return true;
  }
}

export const assignmentService = new AssignmentService();
