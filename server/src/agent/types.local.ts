// TEMPORARY — local stand-in for @shared/types' domain types (Schedule, Room, Booking,
// Event, EventRegistration, Announcement, Assignment, and their DTOs).
//
// Arko's real versions of these already exist on origin/feat/ArKo/backend-data-layer
// (shared/src/types/campus.types.ts) but that branch isn't merged to main yet. Field names
// here are copied 1:1 from schema/schema.md and ARCHITECTURE.md's Agent tool contract so
// that once the real @shared/types lands, every import of this file becomes a one-line
// swap to `from '@shared/types'` — no shape changes needed anywhere that imports it.
//
// DELETE this file once @shared/types exports these for real, and repoint the imports.

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------
export interface Schedule {
  id: string;
  course: string;
  title: string;
  day: DayOfWeek;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  room: string;
  instructor: string;
  section: string;
}

export interface ScheduleFilterDto {
  course?: string;
  day?: string;
}

// ---------------------------------------------------------------------------
// Rooms & bookings
// ---------------------------------------------------------------------------
export type RoomType = 'classroom' | 'lab' | 'seminar';
export type RoomStatus = 'available' | 'unavailable';

export interface Booking {
  id: string;
  room_id: string;
  booked_by: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  purpose: string;
  created_at?: string;
}

export interface Room {
  id: string;
  room_number: string;
  type: RoomType;
  capacity: number;
  equipment: string[];
  floor: number;
  status: RoomStatus;
  bookings?: Booking[];
}

export interface FindAvailableRoomsDto {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  min_capacity?: number;
  equipment?: string[];
}

export interface BookRoomDto {
  id?: string;
  room_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  booked_by: string;
  purpose: string;
}

// ---------------------------------------------------------------------------
// Events & registrations
// ---------------------------------------------------------------------------
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'full';

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  name: string;
  registered_at?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  end_date: string; // YYYY-MM-DD
  venue: string;
  organizer: string;
  capacity: number;
  registered: number;
  registrations?: EventRegistration[];
  status: EventStatus;
}

export interface EventFilterDto {
  date?: string;
  status?: string;
}

export interface RegisterEventDto {
  event_id: string;
  student_id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------
export type AnnouncementPriority = 'high' | 'medium' | 'low';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string; // YYYY-MM-DD
  priority: AnnouncementPriority;
  posted_by: string;
  expires: string; // YYYY-MM-DD
}

export interface AnnouncementFilterDto {
  priority?: string;
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------
export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'late';

export interface Assignment {
  id: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  assigned_date: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  submission_platform: string;
  status: AssignmentStatus;
  marks: number;
}

export interface AssignmentFilterDto {
  course?: string;
  status?: string;
}
