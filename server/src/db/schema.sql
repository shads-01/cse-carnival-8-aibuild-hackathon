-- CampusOS — Supabase schema
-- Run this once in the Supabase SQL Editor (or `psql` against the project) before `npm run seed`.
-- Safe to re-run: every statement is IF NOT EXISTS / OR REPLACE.
--
-- Mirrors schema/schema.md and data/*.json, with rooms[].bookings and events[].registrations
-- split into their own FK'd tables (see ARCHITECTURE.md's Data model section for the why).

-- ============================================================================
-- 1. schedules — data/schedules.json, 1:1
-- ============================================================================
create table if not exists schedules (
  id            text primary key,
  course        text not null,
  title         text not null,
  day           text not null check (day in ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday')),
  start_time    time not null,
  end_time      time not null,
  room          text not null,
  instructor    text not null default 'TBA',
  section       text not null
);

create index if not exists idx_schedules_course on schedules (course);
create index if not exists idx_schedules_day    on schedules (day);

-- ============================================================================
-- 2. rooms — data/rooms.json, minus the embedded `bookings` array
-- ============================================================================
create table if not exists rooms (
  id            text primary key,
  room_number   text not null unique,
  type          text not null check (type in ('classroom', 'lab', 'seminar')),
  capacity      integer not null check (capacity > 0),
  equipment     text[] not null default '{}',
  floor         integer not null,
  status        text not null default 'available' check (status in ('available', 'unavailable'))
);

create index if not exists idx_rooms_status on rooms (status);

-- ============================================================================
-- 3. bookings — was rooms[].bookings, now its own table (1 room : many bookings)
-- ============================================================================
create table if not exists bookings (
  id            text primary key,
  room_id       text not null references rooms (id) on delete cascade,
  booked_by     text not null,
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  purpose       text not null,
  created_at    timestamptz not null default now(),
  check (end_time > start_time)
);

-- Speeds up the overlap check roomService.findAvailable()/book() run:
-- WHERE room_id = ? AND date = ? AND start_time < ? AND end_time > ?
create index if not exists idx_bookings_room_date on bookings (room_id, date);

-- ============================================================================
-- 4. events — data/events.json, minus `registered` (computed) and `registrations`
-- ============================================================================
create table if not exists events (
  id            text primary key,
  name          text not null,
  description   text not null default '',
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  end_date      date not null,
  venue         text not null,
  organizer     text not null,
  capacity      integer not null check (capacity > 0),
  status        text not null default 'upcoming'
                check (status in ('upcoming', 'ongoing', 'completed', 'cancelled', 'full'))
);

create index if not exists idx_events_date   on events (date);
create index if not exists idx_events_status on events (status);

-- ============================================================================
-- 5. event_registrations — was events[].registrations, now its own table
-- ============================================================================
create table if not exists event_registrations (
  id            text primary key,
  event_id      text not null references events (id) on delete cascade,
  student_id    text not null,
  name          text not null,
  registered_at timestamptz not null default now(),
  unique (event_id, student_id)  -- a student can't double-register for the same event
);

create index if not exists idx_event_registrations_event on event_registrations (event_id);

-- events.registered from schema.md is derived, never stored, so it can't drift.
-- roomService/eventService (or a route) can select from this view instead of
-- hand-rolling the COUNT(*) join every time.
create or replace view events_with_registration_count as
select
  e.*,
  count(er.id)::integer as registered
from events e
left join event_registrations er on er.event_id = e.id
group by e.id;

-- ============================================================================
-- 6. announcements — data/announcements.json, 1:1
-- ============================================================================
create table if not exists announcements (
  id            text primary key,
  title         text not null,
  body          text not null,
  date          date not null,
  priority      text not null check (priority in ('high', 'medium', 'low')),
  posted_by     text not null,
  expires       date not null
);

create index if not exists idx_announcements_priority on announcements (priority);
create index if not exists idx_announcements_expires  on announcements (expires);

-- ============================================================================
-- 7. assignments — data/assignments.json, 1:1
-- ============================================================================
create table if not exists assignments (
  id                    text primary key,
  course                text not null,
  course_title          text not null,
  title                 text not null,
  description           text not null default '',
  assigned_date         date not null,
  deadline              date not null,
  submission_platform   text not null,
  status                text not null default 'pending'
                        check (status in ('pending', 'submitted', 'graded', 'late')),
  marks                 integer not null check (marks >= 0)
);

create index if not exists idx_assignments_course on assignments (course);
create index if not exists idx_assignments_status on assignments (status);
create index if not exists idx_assignments_deadline on assignments (deadline);

-- ============================================================================
-- 8. users — Authentication & User Profiles
-- ============================================================================
create table if not exists users (
  id            text primary key,
  email         text not null unique,
  name          text not null,
  password_hash text not null,
  role          text not null default 'USER' check (role in ('ADMIN', 'USER', 'MODERATOR')),
  status        text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED')),
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_users_email on users (email);
create index if not exists idx_users_role  on users (role);

