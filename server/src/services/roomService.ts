import { supabase } from '../config/supabase';
import {
  Room,
  Booking,
  CreateRoomDto,
  UpdateRoomDto,
  FindAvailableRoomsDto,
  BookRoomDto
} from '@shared/types';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import {
  normalizeAndValidateTimeRange,
  parseToUtcDate,
  doTimeRangesOverlap,
  NormalizedTimeRange
} from '../utils/timeUtils';

export class RoomService {
  async list(filter?: { status?: string; type?: string; min_capacity?: number }): Promise<Room[]> {
    try {
      let query = supabase
        .from('rooms')
        .select('*, bookings(*)');

      if (filter) {
        if (filter.status) {
          query = query.eq('status', filter.status);
        }
        if (filter.type) {
          query = query.eq('type', filter.type);
        }
        if (filter.min_capacity) {
          query = query.gte('capacity', filter.min_capacity);
        }
      }

      const { data, error } = await query.order('room_number', { ascending: true });

      if (error) {
        logger.error('Error listing rooms from Supabase:', error.message);
        throw ApiError.internal(`Database query failed: ${error.message}`);
      }

      return (data || []).map((r) => ({
        ...r,
        bookings: r.bookings || []
      })) as Room[];
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal('Failed to list rooms');
    }
  }

  async getById(id: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, bookings(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching room with id ${id}:`, error.message);
      throw ApiError.internal(`Failed to fetch room: ${error.message}`);
    }

    if (!data) return null;

    return {
      ...data,
      bookings: data.bookings || []
    } as Room;
  }

  async getByRoomNumber(roomNumber: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, bookings(*)')
      .eq('room_number', roomNumber)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching room by room_number ${roomNumber}:`, error.message);
      throw ApiError.internal(`Failed to fetch room: ${error.message}`);
    }

    if (!data) return null;

    return {
      ...data,
      bookings: data.bookings || []
    } as Room;
  }

  async create(dto: CreateRoomDto): Promise<Room> {
    const id = dto.id || `room-${Date.now()}`;
    const payload = {
      id,
      room_number: dto.room_number,
      type: dto.type,
      capacity: dto.capacity,
      equipment: dto.equipment || [],
      floor: dto.floor,
      status: dto.status || 'available'
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert(payload)
      .select('*, bookings(*)')
      .single();

    if (error) {
      logger.error('Error creating room in Supabase:', error.message);
      throw ApiError.badRequest(`Failed to create room: ${error.message}`);
    }

    return {
      ...data,
      bookings: data.bookings || []
    } as Room;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Room with ID ${id} not found`);
    }

    const { data, error } = await supabase
      .from('rooms')
      .update(dto)
      .eq('id', id)
      .select('*, bookings(*)')
      .single();

    if (error) {
      logger.error(`Error updating room ${id}:`, error.message);
      throw ApiError.badRequest(`Failed to update room: ${error.message}`);
    }

    return {
      ...data,
      bookings: data.bookings || []
    } as Room;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Room with ID ${id} not found`);
    }

    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) {
      logger.error(`Error deleting room ${id}:`, error.message);
      throw ApiError.internal(`Failed to delete room: ${error.message}`);
    }

    return true;
  }

  /**
   * findAvailable: Finds rooms that are 'available' and have no overlapping bookings for the given time slot.
   * Normalized to UTC and checked against all candidates.
   */
  async findAvailable(filters: FindAvailableRoomsDto): Promise<Room[]> {
    const { date, start_time, end_time, min_capacity, equipment, type } = filters;

    if (!date || !start_time || !end_time) {
      throw ApiError.badRequest('date, start_time, and end_time are required to check room availability');
    }

    let timeRange: NormalizedTimeRange;
    try {
      timeRange = normalizeAndValidateTimeRange(start_time, end_time, date);
    } catch (err: any) {
      throw ApiError.badRequest(err.message || 'Invalid start_time or end_time');
    }

    // 1. Fetch bookings for this date
    const { data: dayBookings, error: bookingErr } = await supabase
      .from('bookings')
      .select('room_id, date, start_time, end_time')
      .eq('date', timeRange.startDate);

    if (bookingErr) {
      logger.error('Error checking overlapping bookings:', bookingErr.message);
      throw ApiError.internal(`Failed to check bookings: ${bookingErr.message}`);
    }

    // 2. Exact UTC overlap check across all bookings on this date
    const bookedRoomIds = new Set<string>();
    for (const b of dayBookings || []) {
      try {
        const existingRange = {
          startEpochMs: parseToUtcDate(b.start_time, b.date).getTime(),
          endEpochMs: parseToUtcDate(b.end_time, b.date).getTime()
        };
        if (doTimeRangesOverlap(timeRange, existingRange)) {
          bookedRoomIds.add(b.room_id);
        }
      } catch {
        if (b.start_time < timeRange.endTime && b.end_time > timeRange.startTime) {
          bookedRoomIds.add(b.room_id);
        }
      }
    }

    // 3. Query rooms
    let roomQuery = supabase
      .from('rooms')
      .select('*, bookings(*)')
      .eq('status', 'available');

    if (min_capacity) {
      roomQuery = roomQuery.gte('capacity', min_capacity);
    }

    if (type) {
      roomQuery = roomQuery.eq('type', type);
    }

    const { data: rooms, error: roomErr } = await roomQuery.order('room_number', { ascending: true });

    if (roomErr) {
      logger.error('Error querying rooms:', roomErr.message);
      throw ApiError.internal(`Failed to query rooms: ${roomErr.message}`);
    }

    // 4. Filter out booked rooms & check equipment if specified
    const availableRooms = (rooms || []).filter((r) => {
      if (bookedRoomIds.has(r.id)) {
        return false;
      }

      if (equipment && equipment.length > 0) {
        const roomEquipment = (r.equipment || []).map((eq: string) => eq.toLowerCase());
        const hasAllEquipment = equipment.every((reqEq: string) =>
          roomEquipment.includes(reqEq.toLowerCase())
        );
        if (!hasAllEquipment) return false;
      }

      return true;
    });

    return availableRooms as Room[];
  }

  /**
   * book: Creates a booking for a room after verifying no overlap exists.
   * Normalizes incoming time to UTC and enforces timezone-safe boundary checks.
   */
  async book(dto: BookRoomDto): Promise<Booking> {
    const { room_id, date, start_time, end_time, booked_by, purpose } = dto;

    if (!room_id || !date || !start_time || !end_time || !booked_by || !purpose) {
      throw ApiError.badRequest('All booking fields (room_id, date, start_time, end_time, booked_by, purpose) are required');
    }

    let timeRange: NormalizedTimeRange;
    try {
      timeRange = normalizeAndValidateTimeRange(start_time, end_time, date);
    } catch (err: any) {
      throw ApiError.badRequest(err.message || 'Invalid start_time or end_time');
    }

    // Check if room exists and is available
    let room = await this.getById(room_id);
    if (!room) {
      room = await this.getByRoomNumber(room_id);
    }

    if (!room) {
      throw ApiError.notFound(`Room "${room_id}" not found`);
    }

    if (room.status === 'unavailable') {
      throw ApiError.conflict(`Room "${room.room_number}" is currently marked unavailable for booking`);
    }

    const resolvedRoomId = room.id;

    // Fetch existing bookings for this room on this date
    const { data: existingBookings, error: conflictErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', resolvedRoomId)
      .eq('date', timeRange.startDate);

    if (conflictErr) {
      logger.error('Error verifying booking conflict:', conflictErr.message);
      throw ApiError.internal('Failed to check booking availability');
    }

    // Check for overlapping bookings in UTC
    const conflictingBooking = (existingBookings || []).find((b) => {
      try {
        const existingRange = {
          startEpochMs: parseToUtcDate(b.start_time, b.date).getTime(),
          endEpochMs: parseToUtcDate(b.end_time, b.date).getTime()
        };
        return doTimeRangesOverlap(timeRange, existingRange);
      } catch {
        return b.start_time < timeRange.endTime && b.end_time > timeRange.startTime;
      }
    });

    if (conflictingBooking) {
      throw ApiError.conflict(
        `Room ${room.room_number} is already booked on ${date} between ${conflictingBooking.start_time} and ${conflictingBooking.end_time} by ${conflictingBooking.booked_by} (${conflictingBooking.purpose})`
      );
    }

    // Insert normalized booking
    const bookingId = dto.id || `bk-${Date.now()}`;
    const { data: newBooking, error: insertErr } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        room_id: resolvedRoomId,
        booked_by,
        date: timeRange.startDate,
        start_time: timeRange.startTime,
        end_time: timeRange.endTime,
        purpose
      })
      .select()
      .single();

    if (insertErr) {
      logger.error('Error inserting booking:', insertErr.message);
      throw ApiError.internal(`Failed to book room: ${insertErr.message}`);
    }

    logger.info(`Successfully booked room ${room.room_number} for ${booked_by} on ${timeRange.startDate} (${timeRange.startTime}-${timeRange.endTime}) UTC`);
    return newBooking as Booking;
  }

  /**
   * cancelBooking: Cancels an existing booking. Optionally verifies booked_by identity.
   */
  async cancelBooking(bookingId: string, bookedBy?: string): Promise<boolean> {
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchErr) {
      logger.error(`Error checking booking ${bookingId}:`, fetchErr.message);
      throw ApiError.internal(`Failed to verify booking: ${fetchErr.message}`);
    }

    if (!booking) {
      throw ApiError.notFound(`Booking with ID "${bookingId}" not found`);
    }

    if (bookedBy && booking.booked_by.toLowerCase() !== bookedBy.toLowerCase()) {
      throw ApiError.forbidden(`Unauthorized: Booking "${bookingId}" was booked by "${booking.booked_by}", not "${bookedBy}"`);
    }

    const { error: deleteErr } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteErr) {
      logger.error(`Error deleting booking ${bookingId}:`, deleteErr.message);
      throw ApiError.internal(`Failed to cancel booking: ${deleteErr.message}`);
    }

    logger.info(`Successfully cancelled booking ${bookingId}`);
    return true;
  }
}

export const roomService = new RoomService();
