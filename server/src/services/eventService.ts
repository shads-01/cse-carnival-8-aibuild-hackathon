import { supabase } from '../config/supabase';
import {
  Event,
  EventRegistration,
  CreateEventDto,
  UpdateEventDto,
  RegisterEventDto,
  EventFilterDto
} from '@shared/types';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class EventService {
  async list(filter?: EventFilterDto): Promise<Event[]> {
    try {
      // Query from events_with_registration_count view + join event_registrations
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
          query = query.eq('venue', filter.venue);
        }
        if (filter.organizer) {
          query = query.ilike('organizer', `%${filter.organizer}%`);
        }
      }

      query = query.order('date', { ascending: true }).order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching events:', error.message);
        throw ApiError.internal(`Failed to fetch events: ${error.message}`);
      }

      return (data || []).map((e) => ({
        ...e,
        registered: Number(e.registered || 0),
        registrations: e.registrations || []
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
    const payload = {
      id,
      name: dto.name,
      description: dto.description || '',
      date: dto.date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      end_date: dto.end_date || dto.date,
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

    const { error } = await supabase
      .from('events')
      .update(dto)
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
   * register: Registers a student for an event after checking capacity and duplicate registration.
   */
  async register(dto: RegisterEventDto): Promise<EventRegistration> {
    const { event_id, student_id, name } = dto;

    if (!event_id || !student_id || !name) {
      throw ApiError.badRequest('event_id, student_id, and name are required for event registration');
    }

    // 1. Fetch event and check existence
    const event = await this.getById(event_id);
    if (!event) {
      throw ApiError.notFound(`Event with ID "${event_id}" not found`);
    }

    if (event.status === 'cancelled') {
      throw ApiError.badRequest(`Cannot register for cancelled event "${event.name}"`);
    }

    // 2. Check if student is already registered
    const { data: existingReg, error: checkErr } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', event_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (checkErr) {
      logger.error('Error checking existing registration:', checkErr.message);
      throw ApiError.internal('Failed to verify registration status');
    }

    if (existingReg) {
      throw ApiError.conflict(
        `Student "${student_id}" (${name}) is already registered for "${event.name}"`
      );
    }

    // 3. Check capacity
    const { count, error: countErr } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    if (countErr) {
      logger.error('Error checking registration count:', countErr.message);
      throw ApiError.internal('Failed to check event capacity');
    }

    const currentCount = count || 0;
    if (currentCount >= event.capacity) {
      throw ApiError.conflict(
        `Registration closed: Event "${event.name}" is already at full capacity (${event.capacity}/${event.capacity})`
      );
    }

    // 4. Insert registration
    const regId = `${event_id}_${student_id}`;
    const { data: newReg, error: insertErr } = await supabase
      .from('event_registrations')
      .insert({
        id: regId,
        event_id,
        student_id,
        name
      })
      .select()
      .single();

    if (insertErr) {
      logger.error('Error registering for event:', insertErr.message);
      throw ApiError.internal(`Failed to register for event: ${insertErr.message}`);
    }

    logger.info(`Successfully registered student ${student_id} (${name}) for event "${event.name}"`);
    return newReg as EventRegistration;
  }

  /**
   * cancelRegistration: Cancels a student's event registration.
   */
  async cancelRegistration(eventId: string, studentIdOrRegId: string): Promise<boolean> {
    const { data: reg, error: fetchErr } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .or(`student_id.eq.${studentIdOrRegId},id.eq.${studentIdOrRegId}`)
      .maybeSingle();

    if (fetchErr || !reg) {
      throw ApiError.notFound(
        `Registration for student/id "${studentIdOrRegId}" on event "${eventId}" not found`
      );
    }

    const { error: deleteErr } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', reg.id);

    if (deleteErr) {
      logger.error(`Error cancelling registration ${reg.id}:`, deleteErr.message);
      throw ApiError.internal(`Failed to cancel registration: ${deleteErr.message}`);
    }

    logger.info(`Successfully cancelled registration ${reg.id} for event ${eventId}`);
    return true;
  }
}

export const eventService = new EventService();
