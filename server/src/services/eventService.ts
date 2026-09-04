import { supabase } from '../config/supabase';
import {
  Event,
  EventRegistration,
  CreateEventDto,
  UpdateEventDto,
  RegisterEventDto
} from '@shared/types';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { normalizeAndValidateTimeRange } from '../utils/timeUtils';

export class EventService {
  async list(filter?: { date?: string; status?: string; venue?: string; organizer?: string }): Promise<Event[]> {
    try {
      let query = supabase
        .from('events_with_registration_count')
        .select('*, registrations:event_registrations(*)');

      if (filter) {
        if (filter.date) {
          query = query.eq('date', filter.date);
        }
        if (filter.status) {
          query = query.eq('status', filter.status);
        }
        if (filter.venue) {
          query = query.ilike('venue', `%${filter.venue}%`);
        }
        if (filter.organizer) {
          query = query.ilike('organizer', `%${filter.organizer}%`);
        }
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) {
        logger.error('Error listing events from Supabase:', error.message);
        throw ApiError.internal(`Database query failed: ${error.message}`);
      }

      return (data || []).map((ev) => ({
        ...ev,
        registered: Number(ev.registered || 0),
        registrations: ev.registrations || []
      })) as Event[];
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal('Failed to fetch events');
    }
  }

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events_with_registration_count')
      .select('*, registrations:event_registrations(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching event with id ${id}:`, error.message);
      throw ApiError.internal(`Failed to fetch event: ${error.message}`);
    }

    if (!data) return null;

    return {
      ...data,
      registered: Number(data.registered || 0),
      registrations: data.registrations || []
    } as Event;
  }

  async create(dto: CreateEventDto): Promise<Event> {
    const id = dto.id || `evt-${Date.now()}`;

    // Normalize and validate date/time range
    let normalized = {
      startDate: dto.date,
      endDate: dto.end_date || dto.date,
      startTime: dto.start_time,
      endTime: dto.end_time
    };

    try {
      const range = normalizeAndValidateTimeRange(
        dto.start_time,
        dto.end_time,
        dto.date,
        dto.end_date || dto.date
      );
      normalized = {
        startDate: range.startDate,
        endDate: range.endDate,
        startTime: range.startTime,
        endTime: range.endTime
      };
    } catch (err: any) {
      throw ApiError.badRequest(err.message || 'Invalid event date/time range');
    }

    const payload = {
      id,
      name: dto.name,
      description: dto.description || '',
      date: normalized.startDate,
      start_time: normalized.startTime,
      end_time: normalized.endTime,
      end_date: normalized.endDate,
      venue: dto.venue,
      organizer: dto.organizer,
      capacity: dto.capacity,
      status: dto.status || 'upcoming'
    };

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error('Error creating event:', error.message);
      throw ApiError.badRequest(`Failed to create event: ${error.message}`);
    }

    const created = await this.getById(id);
    return created || (data as Event);
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Event with ID ${id} not found`);
    }

    const updatePayload: Record<string, any> = { ...dto };

    // If times or dates are updated, validate range
    if (dto.start_time || dto.end_time || dto.date || dto.end_date) {
      const startTime = dto.start_time || existing.start_time;
      const endTime = dto.end_time || existing.end_time;
      const startDate = dto.date || existing.date;
      const endDate = dto.end_date || existing.end_date || startDate;

      try {
        const range = normalizeAndValidateTimeRange(startTime, endTime, startDate, endDate);
        if (dto.start_time) updatePayload.start_time = range.startTime;
        if (dto.end_time) updatePayload.end_time = range.endTime;
        if (dto.date) updatePayload.date = range.startDate;
        if (dto.end_date) updatePayload.end_date = range.endDate;
      } catch (err: any) {
        throw ApiError.badRequest(err.message || 'Invalid event date/time range');
      }
    }

    const { error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      logger.error(`Error updating event ${id}:`, error.message);
      throw ApiError.badRequest(`Failed to update event: ${error.message}`);
    }

    const updated = await this.getById(id);
    return updated!;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Event with ID ${id} not found`);
    }

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      logger.error(`Error deleting event ${id}:`, error.message);
      throw ApiError.internal(`Failed to delete event: ${error.message}`);
    }

    return true;
  }

  /**
   * register: Registers a student for an event.
   * Enforces:
   * 1. Event exists and is not cancelled/completed
   * 2. Student is not already registered (prevents double registration)
   * 3. Event is not at full capacity
   */
  async register(
    eventIdOrDto: string | RegisterEventDto,
    maybeDto?: RegisterEventDto
  ): Promise<EventRegistration> {
    let eventId: string;
    let dto: RegisterEventDto;

    if (typeof eventIdOrDto === 'string') {
      eventId = eventIdOrDto;
      dto = maybeDto || ({} as RegisterEventDto);
    } else {
      dto = eventIdOrDto;
      eventId = (dto as any).event_id;
    }

    const { student_id, name } = dto;

    if (!eventId) {
      throw ApiError.badRequest('event_id is required for registration');
    }

    if (!student_id || !name) {
      throw ApiError.badRequest('student_id and name are required for registration');
    }

    const event = await this.getById(eventId);
    if (!event) {
      throw ApiError.notFound(`Event "${eventId}" not found`);
    }

    if (event.status === 'cancelled' || event.status === 'completed') {
      throw ApiError.badRequest(`Cannot register for an event that is ${event.status}`);
    }

    // 1. Check if student is already registered
    const { data: existingReg, error: checkErr } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', student_id)
      .maybeSingle();

    if (checkErr) {
      logger.error('Error checking existing registration:', checkErr.message);
      throw ApiError.internal('Failed to verify existing registration');
    }

    if (existingReg) {
      throw ApiError.conflict(
        `Student "${name}" (${student_id}) is already registered for event "${event.name}"`
      );
    }

    // 2. Enforce capacity check (live count from event_registrations)
    const { count, error: countErr } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countErr) {
      logger.error('Error counting event registrations:', countErr.message);
      throw ApiError.internal('Failed to verify event capacity');
    }

    const currentRegistrations = count || 0;
    if (currentRegistrations >= event.capacity) {
      throw ApiError.conflict(
        `Event "${event.name}" is at maximum capacity (${event.capacity}/${event.capacity})`
      );
    }

    // 3. Insert registration record
    const regId = `reg-${Date.now()}`;
    const { data: newReg, error: insertErr } = await supabase
      .from('event_registrations')
      .insert({
        id: regId,
        event_id: eventId,
        student_id,
        name
      })
      .select()
      .single();

    if (insertErr) {
      logger.error('Error inserting event registration:', insertErr.message);
      throw ApiError.badRequest(`Failed to register for event: ${insertErr.message}`);
    }

    logger.info(`Successfully registered student ${student_id} for event ${event.name}`);
    return newReg as EventRegistration;
  }

  /**
   * cancelRegistration: Cancels an existing registration.
   * Supports either direct registrationId OR (eventId, studentId).
   */
  async cancelRegistration(registrationOrEventId: string, studentId?: string): Promise<boolean> {
    let reg: any = null;

    // 1. If studentId is provided, look up by (event_id, student_id)
    if (studentId) {
      const { data: regByEvent, error: eventErr } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', registrationOrEventId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (eventErr) {
        logger.error(`Error querying registration by event ${registrationOrEventId}:`, eventErr.message);
      }
      if (regByEvent) {
        reg = regByEvent;
      }
    }

    // 2. If not found, look up by direct registration id
    if (!reg) {
      const { data: regById, error: idErr } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('id', registrationOrEventId)
        .maybeSingle();

      if (idErr) {
        logger.error(`Error querying registration by ID ${registrationOrEventId}:`, idErr.message);
      }
      if (regById) {
        reg = regById;
      }
    }

    if (!reg) {
      throw ApiError.notFound(`Registration "${registrationOrEventId}" not found`);
    }

    if (studentId && reg.student_id !== studentId) {
      throw ApiError.forbidden(`Unauthorized: Registration does not belong to student ID ${studentId}`);
    }

    const { error: deleteErr } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', reg.id);

    if (deleteErr) {
      logger.error(`Error deleting registration ${reg.id}:`, deleteErr.message);
      throw ApiError.internal(`Failed to cancel registration: ${deleteErr.message}`);
    }

    logger.info(`Successfully cancelled registration ${reg.id}`);
    return true;
  }
}

export const eventService = new EventService();
