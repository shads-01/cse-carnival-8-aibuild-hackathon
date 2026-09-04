// TEMPORARY — in-memory stand-in for Arko's real services/*.ts (roomService, eventService,
// etc. on origin/feat/ArKo/backend-data-layer). Method names and signatures below are copied
// 1:1 from his real implementations (list/findAvailable/book/cancelBooking/register/
// cancelRegistration), including which errors they throw (ApiError.notFound/.conflict/
// .forbidden/.badRequest) — so tools.ts's handlers, and the try/catch that converts those
// errors into `{ error }` results, are exercised against the exact shape the real services
// will produce. Swapping a handler's import from './stubData' to
// '../services/roomService' (etc.) at integration time is a one-line change.
//
// DELETE this file once the real services are wired in.

import { ApiError } from '../utils/apiResponse';
import type {
  Announcement,
  AnnouncementFilterDto,
  Assignment,
  AssignmentFilterDto,
  Booking,
  BookRoomDto,
  Event,
  EventFilterDto,
  EventRegistration,
  FindAvailableRoomsDto,
  RegisterEventDto,
  Room,
  Schedule,
  ScheduleFilterDto
} from './types.local';

// ---------------------------------------------------------------------------
// Fixture data — deliberately overlaps with sample_queries/sample_queries.md
// (Room 7A02, a Deep Learning guest lecture) so manual smoke-testing feels real.
// ---------------------------------------------------------------------------

function freshFixtures() {
  const schedules: Schedule[] = [
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

  const rooms: Room[] = [
    {
      id: 'room-001',
      room_number: '7A02',
      type: 'classroom',
      capacity: 45,
      equipment: ['projector', 'whiteboard'],
      floor: 7,
      status: 'available'
    },
    {
      id: 'room-002',
      room_number: '7B03',
      type: 'lab',
      capacity: 30,
      equipment: ['projector', 'AC'],
      floor: 7,
      status: 'available'
    },
    {
      id: 'room-003',
      room_number: '7C01',
      type: 'seminar',
      capacity: 60,
      equipment: ['projector', 'AC', 'whiteboard'],
      floor: 7,
      status: 'unavailable'
    }
  ];

  const bookings: Booking[] = [];

  const events: Event[] = [
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
      registered: 0,
      status: 'upcoming'
    }
  ];

  const eventRegistrations: EventRegistration[] = [];

  const announcements: Announcement[] = [
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

  const assignments: Assignment[] = [
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

  return { schedules, rooms, bookings, events, eventRegistrations, announcements, assignments };
}

let state = freshFixtures();

/** Test-only: resets all in-memory fixtures/state to their initial values. */
export function __resetStubDataForTests(): void {
  state = freshFixtures();
}

function computeRegistered(eventId: string): number {
  return state.eventRegistrations.filter((r) => r.event_id === eventId).length;
}

// ---------------------------------------------------------------------------
// scheduleService
// ---------------------------------------------------------------------------
export const scheduleService = {
  async list(filter: ScheduleFilterDto = {}): Promise<Schedule[]> {
    return state.schedules.filter(
      (s) =>
        (!filter.course || s.course.toLowerCase().includes(filter.course.toLowerCase())) &&
        (!filter.day || s.day === filter.day)
    );
  }
};

// ---------------------------------------------------------------------------
// assignmentService
// ---------------------------------------------------------------------------
export const assignmentService = {
  async list(filter: AssignmentFilterDto = {}): Promise<Assignment[]> {
    return state.assignments.filter(
      (a) =>
        (!filter.course || a.course.toLowerCase().includes(filter.course.toLowerCase())) &&
        (!filter.status || a.status === filter.status)
    );
  }
};

// ---------------------------------------------------------------------------
// announcementService
// ---------------------------------------------------------------------------
export const announcementService = {
  async list(filter: AnnouncementFilterDto = {}): Promise<Announcement[]> {
    return state.announcements.filter((a) => !filter.priority || a.priority === filter.priority);
  }
};

// ---------------------------------------------------------------------------
// eventService
// ---------------------------------------------------------------------------
export const eventService = {
  async list(filter: EventFilterDto = {}): Promise<Event[]> {
    return state.events
      .filter((e) => (!filter.date || e.date === filter.date) && (!filter.status || e.status === filter.status))
      .map((e) => ({ ...e, registered: computeRegistered(e.id) }));
  },

  async register(dto: RegisterEventDto): Promise<EventRegistration> {
    const { event_id, student_id, name } = dto;
    const event = state.events.find((e) => e.id === event_id);
    if (!event) {
      throw ApiError.notFound(`Event with ID "${event_id}" not found`);
    }
    if (event.status === 'cancelled') {
      throw ApiError.badRequest(`Cannot register for cancelled event "${event.name}"`);
    }

    const alreadyRegistered = state.eventRegistrations.some(
      (r) => r.event_id === event_id && r.student_id === student_id
    );
    if (alreadyRegistered) {
      throw ApiError.conflict(`Student "${student_id}" (${name}) is already registered for "${event.name}"`);
    }

    const currentCount = computeRegistered(event_id);
    if (currentCount >= event.capacity) {
      throw ApiError.conflict(
        `Registration closed: Event "${event.name}" is already at full capacity (${event.capacity}/${event.capacity})`
      );
    }

    const registration: EventRegistration = {
      id: `${event_id}_${student_id}`,
      event_id,
      student_id,
      name,
      registered_at: new Date().toISOString()
    };
    state.eventRegistrations.push(registration);
    return registration;
  },

  async cancelRegistration(eventId: string, studentId: string): Promise<boolean> {
    const index = state.eventRegistrations.findIndex(
      (r) => r.event_id === eventId && r.student_id === studentId
    );
    if (index === -1) {
      throw ApiError.notFound(`Registration for student "${studentId}" on event "${eventId}" not found`);
    }
    state.eventRegistrations.splice(index, 1);
    return true;
  }
};

// ---------------------------------------------------------------------------
// roomService
// ---------------------------------------------------------------------------
export const roomService = {
  async findAvailable(filters: FindAvailableRoomsDto): Promise<Room[]> {
    const { date, start_time, end_time, min_capacity, equipment } = filters;

    if (!date || !start_time || !end_time) {
      throw ApiError.badRequest('date, start_time, and end_time are required to check room availability');
    }
    if (start_time >= end_time) {
      throw ApiError.badRequest('start_time must be earlier than end_time');
    }

    const bookedRoomIds = new Set(
      state.bookings
        .filter((b) => b.date === date && b.start_time < end_time && b.end_time > start_time)
        .map((b) => b.room_id)
    );

    return state.rooms.filter((r) => {
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

  async book(dto: BookRoomDto): Promise<Booking> {
    const { room_id, date, start_time, end_time, booked_by, purpose } = dto;

    if (!room_id || !date || !start_time || !end_time || !booked_by || !purpose) {
      throw ApiError.badRequest(
        'All booking fields (room_id, date, start_time, end_time, booked_by, purpose) are required'
      );
    }
    if (start_time >= end_time) {
      throw ApiError.badRequest('start_time must be strictly earlier than end_time');
    }

    const room = state.rooms.find((r) => r.id === room_id || r.room_number === room_id);
    if (!room) {
      throw ApiError.notFound(`Room "${room_id}" not found`);
    }
    if (room.status === 'unavailable') {
      throw ApiError.conflict(`Room "${room.room_number}" is currently marked unavailable for booking`);
    }

    const conflict = state.bookings.find(
      (b) => b.room_id === room.id && b.date === date && b.start_time < end_time && b.end_time > start_time
    );
    if (conflict) {
      throw ApiError.conflict(
        `Room ${room.room_number} is already booked on ${date} between ${conflict.start_time} and ${conflict.end_time} by ${conflict.booked_by} (${conflict.purpose})`
      );
    }

    const booking: Booking = {
      id: dto.id || `bk-${Date.now()}`,
      room_id: room.id,
      booked_by,
      date,
      start_time,
      end_time,
      purpose,
      created_at: new Date().toISOString()
    };
    state.bookings.push(booking);
    return booking;
  },

  async cancelBooking(bookingId: string, bookedBy?: string): Promise<boolean> {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw ApiError.notFound(`Booking with ID "${bookingId}" not found`);
    }

    if (bookedBy) {
      const isMatch =
        booking.booked_by.toLowerCase().trim() === bookedBy.toLowerCase().trim() ||
        booking.booked_by.toLowerCase().includes(bookedBy.toLowerCase().trim());
      if (!isMatch) {
        throw ApiError.forbidden(
          `Unauthorized: booking "${bookingId}" was booked by "${booking.booked_by}", not "${bookedBy}"`
        );
      }
    }

    state.bookings = state.bookings.filter((b) => b.id !== bookingId);
    return true;
  }
};
