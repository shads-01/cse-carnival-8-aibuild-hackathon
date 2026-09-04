import { describe, it, expect, beforeEach } from 'vitest';
import { getToolDefinition, tools } from './tools';
import { __resetStubDataForTests } from './stubData';

function handlerFor(name: string) {
  const def = getToolDefinition(name);
  if (!def) throw new Error(`No tool registered named "${name}"`);
  return def.handler;
}

beforeEach(() => {
  __resetStubDataForTests();
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
