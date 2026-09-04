import { describe, it, expect, beforeAll } from 'vitest';
import { scheduleService } from './scheduleService';
import { roomService } from './roomService';
import { eventService } from './eventService';
import { announcementService } from './announcementService';
import { assignmentService } from './assignmentService';
import { seedDatabase } from '../db/seed';

describe('CampusOS Domain Services Integration Tests', () => {
  beforeAll(async () => {
    // Seed fresh data into Supabase
    await seedDatabase();
  });

  // 1. Schedules
  describe('ScheduleService', () => {
    it('should list all schedules', async () => {
      const schedules = await scheduleService.list();
      expect(schedules.length).toBeGreaterThanOrEqual(24);
      expect(schedules[0]).toHaveProperty('course');
      expect(schedules[0]).toHaveProperty('day');
    });

    it('should filter schedules by course code', async () => {
      const filtered = await scheduleService.list({ course: 'CSE 4113' });
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((s) => {
        expect(s.course.toLowerCase()).toContain('cse 4113');
      });
    });

    it('should perform CRUD on schedules', async () => {
      const testId = `sch-test-${Date.now()}`;
      const created = await scheduleService.create({
        id: testId,
        course: 'CSE 9999',
        title: 'Special Topics in AI',
        day: 'Monday',
        start_time: '10:00',
        end_time: '11:30',
        room: '7C01',
        instructor: 'Dr. Test Instructor',
        section: 'A'
      });
      expect(created.id).toBe(testId);
      expect(created.course).toBe('CSE 9999');

      const fetched = await scheduleService.getById(testId);
      expect(fetched).not.toBeNull();
      expect(fetched?.title).toBe('Special Topics in AI');

      const updated = await scheduleService.update(testId, { section: 'B' });
      expect(updated.section).toBe('B');

      await scheduleService.delete(testId);
      const afterDelete = await scheduleService.getById(testId);
      expect(afterDelete).toBeNull();
    });
  });

  // 2. Rooms & Bookings
  describe('RoomService', () => {
    it('should list all rooms with bookings', async () => {
      const rooms = await roomService.list();
      expect(rooms.length).toBe(20);
      const roomWithBooking = rooms.find((r) => (r.bookings || []).length > 0);
      expect(roomWithBooking).toBeDefined();
    });

    it('should find available rooms excluding overlapping bookings', async () => {
      // 7A06 has booking bk-001 on 2026-09-07 between 13:00 and 14:40
      const available = await roomService.findAvailable({
        date: '2026-09-07',
        start_time: '13:30',
        end_time: '14:00',
        type: 'classroom'
      });

      expect(available.length).toBeGreaterThan(0);
      const hasRoom7A06 = available.some((r) => r.room_number === '7A06');
      expect(hasRoom7A06).toBe(false); // 7A06 must NOT be in available rooms
    });

    it('should book a room and prevent overlapping double-booking', async () => {
      const testDate = '2026-11-20';
      const testRoomId = 'room-001'; // 7A01

      // 1. First booking should succeed
      const booking1 = await roomService.book({
        room_id: testRoomId,
        date: testDate,
        start_time: '10:00',
        end_time: '12:00',
        booked_by: 'Test Student',
        purpose: 'ACM Practice Session'
      });
      expect(booking1.id).toBeDefined();
      expect(booking1.booked_by).toBe('Test Student');

      // 2. Overlapping booking (11:00 - 13:00) should be rejected
      await expect(
        roomService.book({
          room_id: testRoomId,
          date: testDate,
          start_time: '11:00',
          end_time: '13:00',
          booked_by: 'Second Student',
          purpose: 'Robotics Workshop'
        })
      ).rejects.toThrow();

      // 3. Non-overlapping booking on same day (14:00 - 16:00) should succeed
      const booking2 = await roomService.book({
        room_id: testRoomId,
        date: testDate,
        start_time: '14:00',
        end_time: '16:00',
        booked_by: 'Third Student',
        purpose: 'Study Group'
      });
      expect(booking2.id).toBeDefined();

      // Clean up bookings
      await roomService.cancelBooking(booking1.id, 'Test Student');
      await roomService.cancelBooking(booking2.id);
    });
  });

  // 3. Events & Registrations
  describe('EventService', () => {
    it('should list all events with registration count', async () => {
      const events = await eventService.list();
      expect(events.length).toBeGreaterThanOrEqual(7);
      const hackathon = events.find((e) => e.id === 'evt-001');
      expect(hackathon).toBeDefined();
      expect(hackathon?.registered).toBeGreaterThanOrEqual(3);
    });

    it('should register a student and reject double registration', async () => {
      const eventId = 'evt-004';
      const testStudentId = `test-std-${Date.now()}`;

      const reg = await eventService.register({
        event_id: eventId,
        student_id: testStudentId,
        name: 'John Test Doe'
      });
      expect(reg.student_id).toBe(testStudentId);

      // Attempt duplicate registration
      await expect(
        eventService.register({
          event_id: eventId,
          student_id: testStudentId,
          name: 'John Test Doe'
        })
      ).rejects.toThrow(/already registered/i);

      // Clean up registration
      await eventService.cancelRegistration(eventId, testStudentId);
    });

    it('should enforce capacity limits on events', async () => {
      // Create a dummy event with capacity 1
      const tinyEvent = await eventService.create({
        name: 'Tiny Exclusive Workshop',
        date: '2026-10-15',
        start_time: '10:00',
        end_time: '11:00',
        venue: '7B01',
        organizer: 'Test Org',
        capacity: 1
      });

      // 1st registration succeeds
      await eventService.register({
        event_id: tinyEvent.id,
        student_id: 'std-cap-1',
        name: 'First Registrant'
      });

      // 2nd registration must be rejected due to full capacity
      await expect(
        eventService.register({
          event_id: tinyEvent.id,
          student_id: 'std-cap-2',
          name: 'Second Registrant'
        })
      ).rejects.toThrow(/capacity/i);

      // Clean up event (cascades to registrations)
      await eventService.delete(tinyEvent.id);
    });
  });

  // 4. Announcements
  describe('AnnouncementService', () => {
    it('should list announcements and perform CRUD', async () => {
      const announcements = await announcementService.list();
      expect(announcements.length).toBeGreaterThanOrEqual(8);

      const testId = `ann-test-${Date.now()}`;
      const created = await announcementService.create({
        id: testId,
        title: 'Emergency Lab Maintenance',
        body: 'Lab 7B02 will be closed for maintenance tomorrow.',
        priority: 'high',
        posted_by: 'Lab Admin',
        expires: '2026-12-31'
      });
      expect(created.id).toBe(testId);
      expect(created.priority).toBe('high');

      const updated = await announcementService.update(testId, { priority: 'medium' });
      expect(updated.priority).toBe('medium');

      await announcementService.delete(testId);
      const afterDelete = await announcementService.getById(testId);
      expect(afterDelete).toBeNull();
    });
  });

  // 5. Assignments
  describe('AssignmentService', () => {
    it('should list assignments and perform CRUD', async () => {
      const assignments = await assignmentService.list();
      expect(assignments.length).toBeGreaterThanOrEqual(8);

      const testId = `asgn-test-${Date.now()}`;
      const created = await assignmentService.create({
        id: testId,
        course: 'CSE 4113',
        course_title: 'Pattern Recognition',
        title: 'Project Milestone 1',
        description: 'Submit project proposal document',
        deadline: '2026-11-30',
        submission_platform: 'Google Classroom',
        status: 'pending',
        marks: 25
      });
      expect(created.id).toBe(testId);
      expect(created.marks).toBe(25);

      const updated = await assignmentService.update(testId, { status: 'submitted' });
      expect(updated.status).toBe('submitted');

      await assignmentService.delete(testId);
      const afterDelete = await assignmentService.getById(testId);
      expect(afterDelete).toBeNull();
    });
  });
});
