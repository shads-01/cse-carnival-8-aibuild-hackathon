import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiError } from '../utils/apiResponse';

// tools.ts now calls the real services/*.ts (Supabase-backed) instead of the
// deleted stubData.ts stand-in. Mocking the service layer here — the same layer
// runAgent.test.ts mocks `./tools` at — keeps this suite fast/offline while still
// exercising tools.ts's own argument validation, error mapping, and shadow paths.
// The fixture data and conflict/capacity logic below are what stubData.ts used to
// provide; campusServices.test.ts is the real Supabase integration test for the
// services themselves.

vi.mock('../services/scheduleService', () => {
  const schedules = [
    {
      id: 'sch-001',
      course: 'CSE 4113',
      title: 'Machine Learning',
      day: 'Wednesday',
      start_time: '08:00',
      end_time: '09:30',
      room: '7A02',
      instructor: 'Dr. Rahman',
      section: 'B'
    },
    {
      id: 'sch-002',
      course: 'CSE 4113',
      title: 'Machine Learning',
      day: 'Sunday',
      start_time: '10:00',
      end_time: '11:30',
      room: '7A02',
      instructor: 'Dr. Rahman',
      section: 'B'
    }
  ];
  return {
    scheduleService: {
      list: async (filter: { course?: string; day?: string } = {}) =>
        schedules.filter(
          (s) =>
            (!filter.course || s.course.toLowerCase().includes(filter.course.toLowerCase())) &&
            (!filter.day || s.day === filter.day)
        )
    }
  };
});

vi.mock('../services/assignmentService', () => {
  const assignments = [
    {
      id: 'asgn-001',
      course: 'CSE 4113',
      course_title: 'Machine Learning',
      title: 'Assignment 1 — Linear Regression',
      description: 'Implement linear regression from scratch.',
      assigned_date: '2026-08-28',
      deadline: '2026-09-10',
      submission_platform: 'Google Classroom',
      status: 'pending',
      marks: 10
    }
  ];
  return {
    assignmentService: {
      list: async (filter: { course?: string; status?: string } = {}) =>
        assignments.filter(
          (a) =>
            (!filter.course || a.course.toLowerCase().includes(filter.course.toLowerCase())) &&
            (!filter.status || a.status === filter.status)
        )
    }
  };
});

vi.mock('../services/announcementService', () => {
  const announcements = [
    {
      id: 'ann-001',
      title: 'Mid-term routine published',
      body: 'The mid-term exam routine has been published on the portal.',
      date: '2026-09-01',
      priority: 'high',
      posted_by: 'Registrar',
      expires: '2026-09-20'
    }
  ];
  return {
    announcementService: {
      list: async (filter: { priority?: string } = {}) =>
        announcements.filter((a) => !filter.priority || a.priority === filter.priority)
    }
  };
});

vi.mock('../services/eventService', () => {
  const initialEvents = () => [
    {
      id: 'evt-001',
      name: 'Guest Lecture on Deep Learning',
      description: 'An industry talk on modern deep learning practice.',
      date: '2026-09-06',
      start_time: '14:00',
      end_time: '16:00',
      end_date: '2026-09-06',
      venue: '7C01',
      organizer: 'CSE Department',
      capacity: 2,
      status: 'upcoming'
    }
  ];

  let events = initialEvents();
  let registrations: { event_id: string; student_id: string; name: string }[] = [];

  function registeredCount(eventId: string) {
    return registrations.filter((r) => r.event_id === eventId).length;
  }

  return {
    __reset: () => {
      events = initialEvents();
      registrations = [];
    },
    eventService: {
      list: async (filter: { date?: string; status?: string } = {}) =>
        events
          .filter((e) => (!filter.date || e.date === filter.date) && (!filter.status || e.status === filter.status))
          .map((e) => ({ ...e, registered: registeredCount(e.id) })),

      register: async (dto: { event_id: string; student_id: string; name: string }) => {
        const event = events.find((e) => e.id === dto.event_id);
        if (!event) throw ApiError.notFound(`Event with ID "${dto.event_id}" not found`);
        if (event.status === 'cancelled') {
          throw ApiError.badRequest(`Cannot register for cancelled event "${event.name}"`);
        }
        if (registrations.some((r) => r.event_id === dto.event_id && r.student_id === dto.student_id)) {
          throw ApiError.conflict(`Student "${dto.student_id}" (${dto.name}) is already registered for "${event.name}"`);
        }
        if (registeredCount(dto.event_id) >= event.capacity) {
          throw ApiError.conflict(`Event "${event.name}" is at maximum capacity (${event.capacity}/${event.capacity})`);
        }
        registrations.push(dto);
        return { id: `${dto.event_id}_${dto.student_id}`, ...dto, registered_at: new Date().toISOString() };
      },

      cancelRegistration: async (eventId: string, studentId?: string) => {
        const index = registrations.findIndex((r) => r.event_id === eventId && r.student_id === studentId);
        if (index === -1) {
          throw ApiError.notFound(`Registration for student "${studentId}" on event "${eventId}" not found`);
        }
        registrations.splice(index, 1);
        return true;
      }
    }
  };
});

vi.mock('../services/roomService', () => {
  const initialRooms = () => [
    { id: 'room-001', room_number: '7A02', type: 'classroom', capacity: 45, equipment: ['projector', 'whiteboard'], floor: 7, status: 'available' },
    { id: 'room-002', room_number: '7B03', type: 'lab', capacity: 30, equipment: ['projector', 'AC'], floor: 7, status: 'available' },
    { id: 'room-003', room_number: '7C01', type: 'seminar', capacity: 60, equipment: ['projector', 'AC', 'whiteboard'], floor: 7, status: 'unavailable' }
  ];

  let rooms = initialRooms();
  let bookings: { id: string; room_id: string; booked_by: string; date: string; start_time: string; end_time: string; purpose: string }[] = [];

  return {
    __reset: () => {
      rooms = initialRooms();
      bookings = [];
    },
    roomService: {
      findAvailable: async (filters: { date: string; start_time: string; end_time: string; min_capacity?: number; equipment?: string[] }) => {
        const { date, start_time, end_time, min_capacity, equipment } = filters;
        const bookedRoomIds = new Set(
          bookings.filter((b) => b.date === date && b.start_time < end_time && b.end_time > start_time).map((b) => b.room_id)
        );
        return rooms.filter((r) => {
          if (r.status !== 'available') return false;
          if (bookedRoomIds.has(r.id)) return false;
          if (min_capacity && r.capacity < min_capacity) return false;
          if (equipment && equipment.length > 0) {
            const roomEquipment = r.equipment.map((e) => e.toLowerCase());
            if (!equipment.every((e) => roomEquipment.includes(e.toLowerCase()))) return false;
          }
          return true;
        });
      },

      book: async (dto: { room_id: string; date: string; start_time: string; end_time: string; booked_by: string; purpose: string }) => {
        const room = rooms.find((r) => r.id === dto.room_id || r.room_number === dto.room_id);
        if (!room) throw ApiError.notFound(`Room "${dto.room_id}" not found`);
        if (room.status === 'unavailable') {
          throw ApiError.conflict(`Room "${room.room_number}" is currently marked unavailable for booking`);
        }
        const conflict = bookings.find(
          (b) => b.room_id === room.id && b.date === dto.date && b.start_time < dto.end_time && b.end_time > dto.start_time
        );
        if (conflict) {
          throw ApiError.conflict(
            `Room ${room.room_number} is already booked on ${dto.date} between ${conflict.start_time} and ${conflict.end_time} by ${conflict.booked_by} (${conflict.purpose})`
          );
        }
        const booking = { ...dto, id: `bk-${Date.now()}-${Math.random()}`, room_id: room.id };
        bookings.push(booking);
        return booking;
      },

      cancelBooking: async (bookingId: string, bookedBy?: string) => {
        const booking = bookings.find((b) => b.id === bookingId);
        if (!booking) throw ApiError.notFound(`Booking with ID "${bookingId}" not found`);
        if (bookedBy && booking.booked_by.toLowerCase().trim() !== bookedBy.toLowerCase().trim()) {
          throw ApiError.forbidden(`Unauthorized: booking "${bookingId}" was booked by "${booking.booked_by}", not "${bookedBy}"`);
        }
        bookings = bookings.filter((b) => b.id !== bookingId);
        return true;
      }
    }
  };
});

import { getToolDefinition, tools } from './tools';
import * as eventServiceModule from '../services/eventService';
import * as roomServiceModule from '../services/roomService';

function handlerFor(name: string) {
  const def = getToolDefinition(name);
  if (!def) throw new Error(`No tool registered named "${name}"`);
  return def.handler;
}

beforeEach(() => {
  // __reset is a test-only export the mocks above add — not part of the real
  // service modules' types, hence the `any` cast.
  (eventServiceModule as any).__reset();
  (roomServiceModule as any).__reset();
});

describe('tools registry', () => {
  it('registers exactly the 9 tools from the agent tool contract', () => {
    const names = tools.map((t) => t.declaration.name).sort();
    expect(names).toEqual(
      [
        'book_room',
        'cancel_booking',
        'cancel_registration',
        'find_available_rooms',
        'get_announcements',
        'get_assignments',
        'get_events',
        'get_schedule',
        'register_for_event'
      ].sort()
    );
  });
});

describe('read tools — happy path', () => {
  it('get_schedule returns matching rows', async () => {
    const result = await handlerFor('get_schedule')({ course: 'CSE 4113' });
    expect(result.error).toBeUndefined();
    expect(Array.isArray(result.schedule)).toBe(true);
    expect((result.schedule as unknown[]).length).toBeGreaterThan(0);
  });

  it('get_assignments returns matching rows', async () => {
    const result = await handlerFor('get_assignments')({});
    expect(result.error).toBeUndefined();
    expect(Array.isArray(result.assignments)).toBe(true);
  });

  it('get_events returns matching rows', async () => {
    const result = await handlerFor('get_events')({});
    expect(result.error).toBeUndefined();
    expect(Array.isArray(result.events)).toBe(true);
  });

  it('get_announcements returns matching rows', async () => {
    const result = await handlerFor('get_announcements')({ priority: 'high' });
    expect(result.error).toBeUndefined();
    expect(Array.isArray(result.announcements)).toBe(true);
    expect((result.announcements as unknown[]).length).toBeGreaterThan(0);
  });
});

describe('shadow path — nil/missing required params never throw, always a structured error', () => {
  it('find_available_rooms without date/start_time/end_time returns a structured error, not a throw', async () => {
    await expect(handlerFor('find_available_rooms')({})).resolves.toBeDefined();
    const result = await handlerFor('find_available_rooms')({ date: '2026-09-05' });
    expect(typeof result.error).toBe('string');
  });

  it('book_room missing any of its 6 required fields returns a structured error, not a throw', async () => {
    const result = await handlerFor('book_room')({ room_id: '7A02', date: '2026-09-05' });
    expect(typeof result.error).toBe('string');
    expect(result.booking).toBeUndefined();
  });

  it('cancel_booking missing booked_by returns a structured error', async () => {
    const result = await handlerFor('cancel_booking')({ booking_id: 'bk-001' });
    expect(typeof result.error).toBe('string');
  });

  it('register_for_event missing student_id returns a structured error', async () => {
    const result = await handlerFor('register_for_event')({ event_id: 'evt-001', name: 'A Student' });
    expect(typeof result.error).toBe('string');
  });

  it('cancel_registration missing event_id returns a structured error', async () => {
    const result = await handlerFor('cancel_registration')({ student_id: '20-40532' });
    expect(typeof result.error).toBe('string');
  });
});

describe('shadow path — empty result', () => {
  it('find_available_rooms with an impossible min_capacity returns an empty array, not an error', async () => {
    const result = await handlerFor('find_available_rooms')({
      date: '2026-09-05',
      start_time: '15:00',
      end_time: '17:00',
      min_capacity: 9999
    });
    expect(result.error).toBeUndefined();
    expect(result.rooms).toEqual([]);
  });
});

describe('shadow path — booking conflict', () => {
  it('book_room on an already-booked room/window returns a conflict error, not a second booking', async () => {
    const first = await handlerFor('book_room')({
      room_id: '7A02',
      date: '2026-09-05',
      start_time: '15:00',
      end_time: '17:00',
      booked_by: 'Debate Club',
      purpose: 'Practice round'
    });
    expect(first.error).toBeUndefined();

    const second = await handlerFor('book_room')({
      room_id: '7A02',
      date: '2026-09-05',
      start_time: '16:00',
      end_time: '18:00',
      booked_by: 'Chess Club',
      purpose: 'Tournament'
    });
    expect(typeof second.error).toBe('string');
    expect(second.error).toMatch(/already booked/i);
  });
});

describe('shadow path — unauthorized action', () => {
  it('cancel_booking with a mismatched booked_by is refused, not cancelled', async () => {
    const booked = await handlerFor('book_room')({
      room_id: '7A02',
      date: '2026-09-05',
      start_time: '15:00',
      end_time: '17:00',
      booked_by: 'Debate Club',
      purpose: 'Practice round'
    });
    const bookingId = (booked.booking as { id: string }).id;

    const result = await handlerFor('cancel_booking')({ booking_id: bookingId, booked_by: 'Someone Else' });
    expect(typeof result.error).toBe('string');

    // Confirm it really wasn't cancelled — booking the exact same slot again still conflicts.
    const retry = await handlerFor('book_room')({
      room_id: '7A02',
      date: '2026-09-05',
      start_time: '15:00',
      end_time: '17:00',
      booked_by: 'Debate Club',
      purpose: 'Practice round'
    });
    expect(typeof retry.error).toBe('string');
  });

  it('cancel_registration for a different student than the one registered is refused', async () => {
    const reg = await handlerFor('register_for_event')({
      event_id: 'evt-001',
      student_id: '20-40532',
      name: 'A Student'
    });
    expect(reg.error).toBeUndefined();

    const result = await handlerFor('cancel_registration')({ event_id: 'evt-001', student_id: '20-99999' });
    expect(typeof result.error).toBe('string');
  });
});

describe('write tools — happy path', () => {
  it('register_for_event then cancel_registration round-trips cleanly', async () => {
    const reg = await handlerFor('register_for_event')({
      event_id: 'evt-001',
      student_id: '20-40532',
      name: 'A Student'
    });
    expect(reg.error).toBeUndefined();

    const cancel = await handlerFor('cancel_registration')({ event_id: 'evt-001', student_id: '20-40532' });
    expect(cancel.error).toBeUndefined();
    expect(cancel.cancelled).toBe(true);
  });

  it('register_for_event refuses once the event is at capacity', async () => {
    // evt-001's fixture capacity is 2.
    await handlerFor('register_for_event')({ event_id: 'evt-001', student_id: 'stu-1', name: 'One' });
    await handlerFor('register_for_event')({ event_id: 'evt-001', student_id: 'stu-2', name: 'Two' });

    const result = await handlerFor('register_for_event')({ event_id: 'evt-001', student_id: 'stu-3', name: 'Three' });
    expect(typeof result.error).toBe('string');
    expect(result.error).toMatch(/capacity/i);
  });
});
