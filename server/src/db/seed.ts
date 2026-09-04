import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

interface RawBooking {
  booking_id: string;
  booked_by: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

interface RawRoom {
  id: string;
  room_number: string;
  type: string;
  capacity: number;
  equipment: string[];
  floor: number;
  status: string;
  bookings?: RawBooking[];
}

interface RawRegistration {
  student_id: string;
  name: string;
}

interface RawEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  end_date: string;
  venue: string;
  organizer: string;
  capacity: number;
  registered?: number;
  registrations?: RawRegistration[];
  status: string;
}

interface RawSchedule {
  id: string;
  course: string;
  title: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
  section: string;
}

interface RawAnnouncement {
  id: string;
  title: string;
  body: string;
  date: string;
  priority: string;
  posted_by: string;
  expires: string;
}

interface RawAssignment {
  id: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  assigned_date: string;
  deadline: string;
  submission_platform: string;
  status: string;
  marks: number;
}

export async function seedDatabase(cleanTestArtifacts = true) {
  logger.info('🌱 Starting database seed process from data/*.json...');

  if (cleanTestArtifacts) {
    // Clean up dynamically created test records from prior runs
    await supabase.from('event_registrations').delete().like('id', 'reg-1%');
    await supabase.from('bookings').delete().like('id', 'bk-1%');
    await supabase.from('events').delete().like('id', 'evt-1%');
    await supabase.from('events').delete().like('id', 'evt-tiny%');
    await supabase.from('rooms').delete().like('id', 'room-test%');
    await supabase.from('schedules').delete().like('id', 'sch-test%');
  }

  const dataDir = path.resolve(__dirname, '../../../data');

  // 1. Seed Schedules
  const schedulesPath = path.join(dataDir, 'schedules.json');
  if (fs.existsSync(schedulesPath)) {
    const schedules: RawSchedule[] = JSON.parse(fs.readFileSync(schedulesPath, 'utf8'));
    logger.info(`Loading ${schedules.length} schedules...`);
    const { error } = await supabase.from('schedules').upsert(schedules, { onConflict: 'id' });
    if (error) {
      logger.error('Error seeding schedules:', error.message);
      throw error;
    }
    logger.info('✅ Schedules seeded successfully.');
  }

  // 2. Seed Rooms & Bookings
  const roomsPath = path.join(dataDir, 'rooms.json');
  if (fs.existsSync(roomsPath)) {
    const rawRooms: RawRoom[] = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
    const roomsToInsert: Omit<RawRoom, 'bookings'>[] = [];
    const bookingsToInsert: {
      id: string;
      room_id: string;
      booked_by: string;
      date: string;
      start_time: string;
      end_time: string;
      purpose: string;
    }[] = [];

    for (const r of rawRooms) {
      const { bookings, ...roomData } = r;
      roomsToInsert.push(roomData);

      if (bookings && Array.isArray(bookings)) {
        for (const b of bookings) {
          bookingsToInsert.push({
            id: b.booking_id,
            room_id: r.id,
            booked_by: b.booked_by,
            date: b.date,
            start_time: b.start_time,
            end_time: b.end_time,
            purpose: b.purpose
          });
        }
      }
    }

    logger.info(`Loading ${roomsToInsert.length} rooms and ${bookingsToInsert.length} bookings...`);
    const { error: roomsError } = await supabase.from('rooms').upsert(roomsToInsert, { onConflict: 'id' });
    if (roomsError) {
      logger.error('Error seeding rooms:', roomsError.message);
      throw roomsError;
    }

    if (bookingsToInsert.length > 0) {
      const { error: bookingsError } = await supabase
        .from('bookings')
        .upsert(bookingsToInsert, { onConflict: 'id' });
      if (bookingsError) {
        logger.error('Error seeding bookings:', bookingsError.message);
        throw bookingsError;
      }
    }
    logger.info('✅ Rooms and bookings seeded successfully.');
  }

  // 3. Seed Events & Registrations
  const eventsPath = path.join(dataDir, 'events.json');
  if (fs.existsSync(eventsPath)) {
    const rawEvents: RawEvent[] = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    const eventsToInsert: Omit<RawEvent, 'registered' | 'registrations'>[] = [];
    const registrationsToInsert: {
      id: string;
      event_id: string;
      student_id: string;
      name: string;
    }[] = [];

    for (const e of rawEvents) {
      const { registered, registrations, ...eventData } = e;
      eventsToInsert.push(eventData);

      if (registrations && Array.isArray(registrations)) {
        for (const reg of registrations) {
          registrationsToInsert.push({
            id: `${e.id}_${reg.student_id}`,
            event_id: e.id,
            student_id: reg.student_id,
            name: reg.name
          });
        }
      }
    }

    logger.info(`Loading ${eventsToInsert.length} events and ${registrationsToInsert.length} registrations...`);
    const { error: eventsError } = await supabase.from('events').upsert(eventsToInsert, { onConflict: 'id' });
    if (eventsError) {
      logger.error('Error seeding events:', eventsError.message);
      throw eventsError;
    }

    if (registrationsToInsert.length > 0) {
      const { error: regError } = await supabase
        .from('event_registrations')
        .upsert(registrationsToInsert, { onConflict: 'id' });
      if (regError) {
        logger.error('Error seeding event_registrations:', regError.message);
        throw regError;
      }
    }
    logger.info('✅ Events and registrations seeded successfully.');
  }

  // 4. Seed Announcements
  const announcementsPath = path.join(dataDir, 'announcements.json');
  if (fs.existsSync(announcementsPath)) {
    const announcements: RawAnnouncement[] = JSON.parse(fs.readFileSync(announcementsPath, 'utf8'));
    logger.info(`Loading ${announcements.length} announcements...`);
    const { error } = await supabase.from('announcements').upsert(announcements, { onConflict: 'id' });
    if (error) {
      logger.error('Error seeding announcements:', error.message);
      throw error;
    }
    logger.info('✅ Announcements seeded successfully.');
  }

  // 5. Seed Assignments
  const assignmentsPath = path.join(dataDir, 'assignments.json');
  if (fs.existsSync(assignmentsPath)) {
    const assignments: RawAssignment[] = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    logger.info(`Loading ${assignments.length} assignments...`);
    const { error } = await supabase.from('assignments').upsert(assignments, { onConflict: 'id' });
    if (error) {
      logger.error('Error seeding assignments:', error.message);
      throw error;
    }
    logger.info('✅ Assignments seeded successfully.');
  }

  logger.info('🎉 Database seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Seed script failed:', err);
      process.exit(1);
    });
}
