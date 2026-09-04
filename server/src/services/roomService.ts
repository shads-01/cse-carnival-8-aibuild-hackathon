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

      query = query.order('room_number', { ascending: true });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching rooms:', error.message);
        throw ApiError.internal(`Failed to fetch rooms: ${error.message}`);
      }

      return (data || []) as Room[];
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal('Failed to fetch rooms');
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

    return (data as Room) || null;
  }

  async getByRoomNumber(roomNumber: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, bookings(*)')
      .eq('room_number', roomNumber)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching room with room_number ${roomNumber}:`, error.message);
      throw ApiError.internal(`Failed to fetch room: ${error.message}`);
    }

    return (data as Room) || null;
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
      logger.error('Error creating room:', error.message);
      throw ApiError.badRequest(`Failed to create room: ${error.message}`);
    }

    return data as Room;
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

    return data as Room;
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
   * Overlap condition: (start1 < end2) && (end1 > start2) on the same date.
   */
  async findAvailable(filters: FindAvailableRoomsDto): Promise<Room[]> {
    const { date, start_time, end_time, min_capacity, equipment, type } = filters;

    if (!date || !start_time || !end_time) {
      throw ApiError.badRequest('date, start_time, and end_time are required to check room availability');
    }

    if (start_time >= end_time) {
      throw ApiError.badRequest('start_time must be earlier than end_time');
    }

    // 1. Fetch all bookings for this date that overlap with [start_time, end_time]
    // Overlap: existing.start_time < target.end_time AND existing.end_time > target.start_time
    const { data: overlappingBookings, error: bookingErr } = await supabase
      .from('bookings')
      .select('room_id, start_time, end_time')
      .eq('date', date)
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (bookingErr) {
      logger.error('Error checking overlapping bookings:', bookingErr.message);
      throw ApiError.internal(`Failed to check bookings: ${bookingErr.message}`);
    }

    const bookedRoomIds = new Set((overlappingBookings || []).map((b) => b.room_id));

    // 2. Query rooms
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

    // 3. Filter out booked rooms & check equipment if specified
    const availableRooms = (rooms || []).filter((r) => {
      // Must not be booked during the requested window
      if (bookedRoomIds.has(r.id)) {
        return false;
      }

      // Check equipment array filter if requested
      if (equipment && equipment.length > 0) {
        const roomEquipment = (r.equipment || []).map((eq: string) => eq.toLowerCase());
        const hasAllEquipment = equipment.every((reqEq) =>
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
   */
  async book(dto: BookRoomDto): Promise<Booking> {
    const { room_id, date, start_time, end_time, booked_by, purpose } = dto;

    if (!room_id || !date || !start_time || !end_time || !booked_by || !purpose) {
      throw ApiError.badRequest('All booking fields (room_id, date, start_time, end_time, booked_by, purpose) are required');
    }

    if (start_time >= end_time) {
      throw ApiError.badRequest('start_time must be strictly earlier than end_time');
    }

    // Check if room exists and is available
    // Handle both room id (e.g. "room-001") and room_number (e.g. "7A01")
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

    // Check for overlapping bookings
    const { data: conflicts, error: conflictErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', resolvedRoomId)
      .eq('date', date)
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (conflictErr) {
      logger.error('Error verifying booking conflict:', conflictErr.message);
      throw ApiError.internal('Failed to check booking availability');
    }

    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0];
      throw ApiError.conflict(
        `Room ${room.room_number} is already booked on ${date} between ${conflict.start_time} and ${conflict.end_time} by ${conflict.booked_by} (${conflict.purpose})`
      );
    }

    // Insert booking
    const bookingId = dto.id || `bk-${Date.now()}`;
    const { data: newBooking, error: insertErr } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        room_id: resolvedRoomId,
        booked_by,
        date,
        start_time,
        end_time,
        purpose
      })
      .select()
      .single();

    if (insertErr) {
      logger.error('Error inserting booking:', insertErr.message);
      throw ApiError.internal(`Failed to book room: ${insertErr.message}`);
    }

    logger.info(`Successfully booked room ${room.room_number} for ${booked_by} on ${date} (${start_time}-${end_time})`);
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

    if (fetchErr || !booking) {
      throw ApiError.notFound(`Booking with ID "${bookingId}" not found`);
    }

    if (bookedBy) {
      const isMatch = booking.booked_by.toLowerCase().trim() === bookedBy.toLowerCase().trim() ||
                      booking.booked_by.toLowerCase().includes(bookedBy.toLowerCase().trim());
      if (!isMatch) {
        throw ApiError.forbidden(
          `Unauthorized: booking "${bookingId}" was booked by "${booking.booked_by}", not "${bookedBy}"`
        );
      }
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
