export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';

// ============================================================================
// 1. Schedules
// ============================================================================
export interface Schedule {
  id: string;
  course: string;
  title: string;
  day: DayOfWeek;
  start_time: string; // HH:mm (24h)
  end_time: string;   // HH:mm (24h)
  room: string;
  instructor: string;
  section: string;
}

export interface CreateScheduleDto {
  id?: string;
  course: string;
  title: string;
  day: DayOfWeek;
  start_time: string;
  end_time: string;
  room: string;
  instructor?: string;
  section: string;
}

export interface UpdateScheduleDto {
  course?: string;
  title?: string;
  day?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  room?: string;
  instructor?: string;
  section?: string;
}

export interface ScheduleFilterDto {
  course?: string;
  day?: string;
  room?: string;
  instructor?: string;
  section?: string;
}

// ============================================================================
// 2. Rooms & Bookings
// ============================================================================
export type RoomType = 'classroom' | 'lab' | 'seminar';
export type RoomStatus = 'available' | 'unavailable';

export interface Booking {
  id: string;
  room_id: string;
  booked_by: string;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
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

export interface CreateRoomDto {
  id?: string;
  room_number: string;
  type: RoomType;
  capacity: number;
  equipment?: string[];
  floor: number;
  status?: RoomStatus;
}

export interface UpdateRoomDto {
  room_number?: string;
  type?: RoomType;
  capacity?: number;
  equipment?: string[];
  floor?: number;
  status?: RoomStatus;
}

export interface FindAvailableRoomsDto {
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  min_capacity?: number;
  equipment?: string[];
  type?: RoomType;
}

export interface BookRoomDto {
  id?: string;
  room_id: string;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  booked_by: string;
  purpose: string;
}

export interface CancelBookingDto {
  booking_id: string;
  booked_by?: string;
}

// ============================================================================
// 3. Events & Registrations
// ============================================================================
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
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  end_date: string;   // YYYY-MM-DD
  venue: string;
  organizer: string;
  capacity: number;
  registered: number;
  registrations?: EventRegistration[];
  status: EventStatus;
}

export interface CreateEventDto {
  id?: string;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  end_date?: string;
  venue: string;
  organizer: string;
  capacity: number;
  status?: EventStatus;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  end_date?: string;
  venue?: string;
  organizer?: string;
  capacity?: number;
  status?: EventStatus;
}

export interface RegisterEventDto {
  event_id: string;
  student_id: string;
  name: string;
}

export interface CancelRegistrationDto {
  event_id: string;
  student_id: string;
}

export interface EventFilterDto {
  date?: string;
  status?: string;
  venue?: string;
  organizer?: string;
}

// ============================================================================
// 4. Announcements
// ============================================================================
export type AnnouncementPriority = 'high' | 'medium' | 'low';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;       // YYYY-MM-DD
  priority: AnnouncementPriority;
  posted_by: string;
  expires: string;    // YYYY-MM-DD
}

export interface CreateAnnouncementDto {
  id?: string;
  title: string;
  body: string;
  date?: string;
  priority: AnnouncementPriority;
  posted_by: string;
  expires: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  body?: string;
  date?: string;
  priority?: AnnouncementPriority;
  posted_by?: string;
  expires?: string;
}

export interface AnnouncementFilterDto {
  priority?: string;
  posted_by?: string;
  unexpired_only?: boolean;
}

// ============================================================================
// 5. Assignments
// ============================================================================
export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'late';

export interface Assignment {
  id: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  assigned_date: string; // YYYY-MM-DD
  deadline: string;      // YYYY-MM-DD
  submission_platform: string;
  status: AssignmentStatus;
  marks: number;
}

export interface CreateAssignmentDto {
  id?: string;
  course: string;
  course_title: string;
  title: string;
  description?: string;
  assigned_date?: string;
  deadline: string;
  submission_platform: string;
  status?: AssignmentStatus;
  marks: number;
}

export interface UpdateAssignmentDto {
  course?: string;
  course_title?: string;
  title?: string;
  description?: string;
  assigned_date?: string;
  deadline?: string;
  submission_platform?: string;
  status?: AssignmentStatus;
  marks?: number;
}

export interface AssignmentFilterDto {
  course?: string;
  status?: string;
}
