import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('CampusOS REST API Endpoints End-to-End Tests', () => {
  // 1. Health
  it('GET /api/v1/health should return 200 OK with server status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  // 2. Schedules
  it('GET /api/v1/schedules should return list of schedules', async () => {
    const res = await request(app).get('/api/v1/schedules');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(24);
  });

  it('GET /api/v1/schedules with filter', async () => {
    const res = await request(app).get('/api/v1/schedules?day=Sunday');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((s: any) => expect(s.day).toBe('Sunday'));
  });

  // 3. Rooms
  it('GET /api/v1/rooms should return list of rooms with bookings', async () => {
    const res = await request(app).get('/api/v1/rooms');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(20);
    expect(res.body.data[0]).toHaveProperty('bookings');
  });

  it('GET /api/v1/rooms/available should return available rooms', async () => {
    const res = await request(app).get(
      '/api/v1/rooms/available?date=2026-09-07&start_time=13:30&end_time=14:00'
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const hasBookedRoom = res.body.data.some((r: any) => r.room_number === '7A06');
    expect(hasBookedRoom).toBe(false);
  });

  // 4. Events
  it('GET /api/v1/events should return events with registration count', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(7);
    expect(res.body.data[0]).toHaveProperty('registered');
  });

  // 5. Announcements
  it('GET /api/v1/announcements should return announcements list', async () => {
    const res = await request(app).get('/api/v1/announcements');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
  });

  // 6. Assignments
  it('GET /api/v1/assignments should return assignments list', async () => {
    const res = await request(app).get('/api/v1/assignments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
  });

  // 7. Booking Conflict rejection via API
  it('POST /api/v1/rooms/:id/book should reject overlapping booking with 409 Conflict', async () => {
    // 7A06 has bk-001 on 2026-09-07 (13:00 - 14:40)
    const res = await request(app)
      .post('/api/v1/rooms/7A06/book')
      .send({
        date: '2026-09-07',
        start_time: '13:30',
        end_time: '14:00',
        booked_by: 'Double Booker',
        purpose: 'Conflict Test'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already booked/i);
  });

  // 8. Event Capacity rejection via API
  it('POST /api/v1/events/:id/register should reject duplicate student registration with 409 Conflict', async () => {
    // evt-001 already has student 20-40532
    const res = await request(app)
      .post('/api/v1/events/evt-001/register')
      .send({
        student_id: '20-40532',
        name: 'Sakibul Hassan'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });
});
