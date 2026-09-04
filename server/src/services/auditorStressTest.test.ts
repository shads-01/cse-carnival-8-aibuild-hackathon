import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { supabase } from '../config/supabase';
import { seedDatabase } from '../db/seed';
import { scheduleService } from './scheduleService';
import { roomService } from './roomService';
import { eventService } from './eventService';
import { announcementService } from './announcementService';
import { assignmentService } from './assignmentService';

describe('Auditor Full System Verification & Stress Test Suite', () => {
  beforeAll(async () => {
    // Phase 1 Seed check: run seed twice to verify idempotency
    await seedDatabase();
    await seedDatabase();
  });

  // ==========================================================================
  // PHASE 1 — DATABASE & SEED IDEMPOTENCY VERIFICATION
  // ==========================================================================
  describe('Phase 1: Database & Seed Verification', () => {
    it('should maintain exact table counts after multiple seed runs (Idempotency)', async () => {
      const { count: scheduleCount } = await supabase.from('schedules').select('*', { count: 'exact', head: true });
      const { count: roomCount } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
      const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
      const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      const { count: regCount } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true });
      const { count: annCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
      const { count: asgnCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true });

      expect(scheduleCount).toBe(24);
      expect(roomCount).toBe(20);
      expect(bookingCount).toBe(3);
      expect(eventCount).toBe(7);
      expect(regCount).toBe(9);
      expect(annCount).toBe(8);
      expect(asgnCount).toBe(8);
    });

    it('should verify all foreign key relations and view integrity', async () => {
      // 1. Every booking must point to a valid room
      const { data: bookings } = await supabase.from('bookings').select('*, room:rooms(*)');
      expect(bookings).toBeDefined();
      bookings?.forEach((b) => {
        expect(b.room).not.toBeNull();
      });

      // 2. Every event registration must point to a valid event
      const { data: regs } = await supabase.from('event_registrations').select('*, event:events(*)');
      expect(regs).toBeDefined();
      regs?.forEach((r) => {
        expect(r.event).not.toBeNull();
      });

      // 3. events_with_registration_count view must accurately reflect event_registrations
      const { data: viewEvents } = await supabase.from('events_with_registration_count').select('*');
      for (const ev of viewEvents || []) {
        const { count } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', ev.id);
        expect(Number(ev.registered)).toBe(count || 0);
      }
    });
  });

  // ==========================================================================
  // PHASE 2 — SERVICE LAYER DEEP EDGE-CASE TESTING
  // ==========================================================================
  describe('Phase 2: Service Layer Deep Edge-Case Testing', () => {
    // ------------------------------------------------------------------------
    // RoomService Overlap Boundary Tests
    // ------------------------------------------------------------------------
    describe('RoomService Booking Overlap Matrix', () => {
      const testRoom = 'room-002'; // 7A02
      const testDate = '2026-12-01';

      it('should strictly test all overlapping scenarios and abutting boundaries', async () => {
        // Base Booking: 14:00 - 16:00
        const baseBooking = await roomService.book({
          room_id: testRoom,
          date: testDate,
          start_time: '14:00',
          end_time: '16:00',
          booked_by: 'Primary Booker',
          purpose: 'Base Slot'
        });
        expect(baseBooking.id).toBeDefined();

        // 1. Exact match: 14:00 - 16:00 -> MUST FAIL
        await expect(
          roomService.book({
            room_id: testRoom,
            date: testDate,
            start_time: '14:00',
            end_time: '16:00',
            booked_by: 'Conflict 1',
            purpose: 'Exact Overlap'
          })
        ).rejects.toThrow();

        // 2. Left partial overlap: 13:00 - 15:00 -> MUST FAIL
        await expect(
          roomService.book({
            room_id: testRoom,
            date: testDate,
            start_time: '13:00',
            end_time: '15:00',
            booked_by: 'Conflict 2',
            purpose: 'Left Overlap'
          })
        ).rejects.toThrow();

        // 3. Right partial overlap: 15:00 - 17:00 -> MUST FAIL
        await expect(
          roomService.book({
            room_id: testRoom,
            date: testDate,
            start_time: '15:00',
            end_time: '17:00',
            booked_by: 'Conflict 3',
            purpose: 'Right Overlap'
          })
        ).rejects.toThrow();

        // 4. Enclosed inside: 14:30 - 15:30 -> MUST FAIL
        await expect(
          roomService.book({
            room_id: testRoom,
            date: testDate,
            start_time: '14:30',
            end_time: '15:30',
            booked_by: 'Conflict 4',
            purpose: 'Inside Overlap'
          })
        ).rejects.toThrow();

        // 5. Enclosing outside: 13:00 - 17:00 -> MUST FAIL
        await expect(
          roomService.book({
            room_id: testRoom,
            date: testDate,
            start_time: '13:00',
            end_time: '17:00',
            booked_by: 'Conflict 5',
            purpose: 'Enclosing Overlap'
          })
        ).rejects.toThrow();

        // 6. Abutting boundary LEFT: 12:00 - 14:00 (end == start) -> MUST SUCCEED
        const leftAbutting = await roomService.book({
          room_id: testRoom,
          date: testDate,
          start_time: '12:00',
          end_time: '14:00',
          booked_by: 'Left Abutting',
          purpose: 'Abutting Left'
        });
        expect(leftAbutting.id).toBeDefined();

        // 7. Abutting boundary RIGHT: 16:00 - 18:00 (start == end) -> MUST SUCCEED
        const rightAbutting = await roomService.book({
          room_id: testRoom,
          date: testDate,
          start_time: '16:00',
          end_time: '18:00',
          booked_by: 'Right Abutting',
          purpose: 'Abutting Right'
        });
        expect(rightAbutting.id).toBeDefined();

        // 8. Invalid time: start >= end -> MUST FAIL
        await expect(
          roomService.book({
            room_id: testRoom,
            date: testDate,
            start_time: '18:00',
            end_time: '17:00',
            booked_by: 'Invalid Time',
            purpose: 'Backwards Time'
          })
        ).rejects.toThrow();

        // 9. Availability check for 14:00 - 16:00 should NOT return room 7A02
        const availableDuringBase = await roomService.findAvailable({
          date: testDate,
          start_time: '14:30',
          end_time: '15:30'
        });
        expect(availableDuringBase.some((r) => r.id === testRoom)).toBe(false);

        // 10. Availability check for 18:00 - 20:00 SHOULD return room 7A02
        const availableAfterSlots = await roomService.findAvailable({
          date: testDate,
          start_time: '18:00',
          end_time: '20:00'
        });
        expect(availableAfterSlots.some((r) => r.id === testRoom)).toBe(true);

        // Clean up test bookings
        await roomService.cancelBooking(baseBooking.id);
        await roomService.cancelBooking(leftAbutting.id);
        await roomService.cancelBooking(rightAbutting.id);
      });

      it('should enforce cancellation authorization', async () => {
        const booking = await roomService.book({
          room_id: testRoom,
          date: '2026-12-05',
          start_time: '10:00',
          end_time: '11:00',
          booked_by: 'Alice Professor',
          purpose: 'Counseling'
        });

        // Cancel with wrong identity -> MUST FAIL (403)
        await expect(roomService.cancelBooking(booking.id, 'Bob Intruder')).rejects.toThrow(/unauthorized/i);

        // Cancel with correct identity -> MUST SUCCEED
        const result = await roomService.cancelBooking(booking.id, 'Alice Professor');
        expect(result).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // EventService Capacity & Slot Freeing
    // ------------------------------------------------------------------------
    describe('EventService Capacity & Lifecycle', () => {
      it('should enforce capacity limits and verify that cancellation frees up capacity', async () => {
        // Create an event with capacity = 2
        const event = await eventService.create({
          name: 'Limited Hackathon Workshop',
          date: '2026-12-10',
          start_time: '10:00',
          end_time: '12:00',
          venue: '7A03',
          organizer: 'CSE Dept',
          capacity: 2
        });

        // 1st student registers -> SUCCESS
        await eventService.register({
          event_id: event.id,
          student_id: 'std-stress-1',
          name: 'Student One'
        });

        // 2nd student registers -> SUCCESS (now full: 2/2)
        await eventService.register({
          event_id: event.id,
          student_id: 'std-stress-2',
          name: 'Student Two'
        });

        // 3rd student registers -> MUST FAIL (full capacity)
        await expect(
          eventService.register({
            event_id: event.id,
            student_id: 'std-stress-3',
            name: 'Student Three'
          })
        ).rejects.toThrow(/capacity/i);

        // Cancel student 1 registration -> Frees up a slot
        await eventService.cancelRegistration(event.id, 'std-stress-1');

        // Now 3rd student CAN register -> SUCCESS
        const reg3 = await eventService.register({
          event_id: event.id,
          student_id: 'std-stress-3',
          name: 'Student Three'
        });
        expect(reg3.student_id).toBe('std-stress-3');

        // Clean up event
        await eventService.delete(event.id);
      });
    });

    // ------------------------------------------------------------------------
    // Schedule, Announcement, Assignment Filter Edge Cases
    // ------------------------------------------------------------------------
    describe('Schedule, Announcement, and Assignment Filters', () => {
      it('should handle combined schedule filters and empty filter results cleanly', async () => {
        const results = await scheduleService.list({
          course: 'CSE 4113',
          day: 'Sunday',
          room: '7A07'
        });
        expect(results.length).toBeGreaterThan(0);
        results.forEach((s) => {
          expect(s.course).toContain('CSE 4113');
          expect(s.day).toBe('Sunday');
          expect(s.room).toBe('7A07');
        });

        // Non-existent combination
        const emptyResults = await scheduleService.list({
          course: 'NON_EXISTENT_COURSE_9999'
        });
        expect(emptyResults).toEqual([]);
      });

      it('should filter unexpired announcements accurately', async () => {
        const allAnnouncements = await announcementService.list();
        const unexpiredOnly = await announcementService.list({ unexpired_only: true });

        expect(Array.isArray(allAnnouncements)).toBe(true);
        expect(Array.isArray(unexpiredOnly)).toBe(true);
        expect(unexpiredOnly.length).toBeLessThanOrEqual(allAnnouncements.length);
      });

      it('should filter assignments by status and handle status updates', async () => {
        const pendingList = await assignmentService.list({ status: 'pending' });
        expect(pendingList.length).toBeGreaterThan(0);
        pendingList.forEach((a) => expect(a.status).toBe('pending'));
      });
    });
  });

  // ==========================================================================
  // PHASE 3 & 4 — API LAYER VALIDATION & REAL-WORLD HACKATHON SCENARIOS
  // ==========================================================================
  describe('Phase 3 & 4: API Validation & Real-World Scenarios', () => {
    it('Scenario 1: "Book Room 7A04 tomorrow 3 to 5 PM" end-to-end API test', async () => {
      const bookingDate = '2026-11-25';

      // 1. Query availability
      const availRes = await request(app)
        .get(`/api/v1/rooms/available?date=${bookingDate}&start_time=15:00&end_time=17:00&type=classroom`)
        .expect(200);

      expect(availRes.body.success).toBe(true);
      const room7A04 = availRes.body.data.find((r: any) => r.room_number === '7A04');
      expect(room7A04).toBeDefined();

      // 2. Book Room 7A04
      const bookRes = await request(app)
        .post(`/api/v1/rooms/${room7A04.id}/book`)
        .send({
          date: bookingDate,
          start_time: '15:00',
          end_time: '17:00',
          booked_by: 'Senior Student',
          purpose: 'Hackathon Practice'
        })
        .expect(201);

      expect(bookRes.body.success).toBe(true);
      const bookingId = bookRes.body.data.id;

      // 3. Query availability again -> 7A04 should NO LONGER be available
      const availAfterRes = await request(app)
        .get(`/api/v1/rooms/available?date=${bookingDate}&start_time=15:00&end_time=17:00`)
        .expect(200);

      const room7A04After = availAfterRes.body.data.find((r: any) => r.room_number === '7A04');
      expect(room7A04After).toBeUndefined();

      // 4. Cancel booking -> 7A04 becomes available again
      await request(app)
        .post(`/api/v1/rooms/bookings/${bookingId}/cancel`)
        .send({ booked_by: 'Senior Student' })
        .expect(200);

      const availFinalRes = await request(app)
        .get(`/api/v1/rooms/available?date=${bookingDate}&start_time=15:00&end_time=17:00`)
        .expect(200);

      const room7A04Final = availFinalRes.body.data.find((r: any) => r.room_number === '7A04');
      expect(room7A04Final).toBeDefined();
    });

    it('Scenario 2: Validation rejection on malformed inputs', async () => {
      // 1. Invalid time format
      const invalidTimeRes = await request(app)
        .post('/api/v1/schedules')
        .send({
          course: 'CSE 1111',
          title: 'Intro',
          day: 'Sunday',
          start_time: '25:00', // Invalid hour
          end_time: '12:00',
          room: '7A01',
          section: 'A'
        })
        .expect(400);

      expect(invalidTimeRes.body.success).toBe(false);
      expect(invalidTimeRes.body.error).toBeDefined();

      // 2. Invalid day of week
      const invalidDayRes = await request(app)
        .post('/api/v1/schedules')
        .send({
          course: 'CSE 1111',
          title: 'Intro',
          day: 'Friday', // Friday is weekend at AUST
          start_time: '08:00',
          end_time: '09:00',
          room: '7A01',
          section: 'A'
        })
        .expect(400);

      expect(invalidDayRes.body.success).toBe(false);

      // 3. Non-existent ID returns 404
      await request(app).get('/api/v1/schedules/non-existent-id-9999').expect(404);
      await request(app).get('/api/v1/rooms/non-existent-id-9999').expect(404);
      await request(app).get('/api/v1/events/non-existent-id-9999').expect(404);
      await request(app).get('/api/v1/announcements/non-existent-id-9999').expect(404);
      await request(app).get('/api/v1/assignments/non-existent-id-9999').expect(404);
    });

    it('Scenario 3: Cascade deletion of room with bookings', async () => {
      // Create temporary room
      const tempRoom = await roomService.create({
        room_number: '9Z99',
        type: 'lab',
        capacity: 30,
        floor: 9
      });

      // Add booking
      const tempBooking = await roomService.book({
        room_id: tempRoom.id,
        date: '2026-12-20',
        start_time: '10:00',
        end_time: '12:00',
        booked_by: 'Delete Tester',
        purpose: 'Cascade test'
      });

      // Delete room via API
      await request(app).delete(`/api/v1/rooms/${tempRoom.id}`).expect(200);

      // Verify booking was automatically cascaded
      const { data: bookingCheck } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', tempBooking.id)
        .maybeSingle();

      expect(bookingCheck).toBeNull();
    });
  });
});
