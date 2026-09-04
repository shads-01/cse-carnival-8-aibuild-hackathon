import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';

vi.mock('../../agent/runAgent', () => ({
  runAgent: vi.fn()
}));

import { runAgent } from '../../agent/runAgent';
import app from '../../app';

const mockRunAgent = runAgent as unknown as Mock;

beforeEach(() => {
  mockRunAgent.mockReset();
});

describe('POST /api/v1/agent/chat', () => {
  it('returns exactly { reply, mutated } for a valid message', async () => {
    mockRunAgent.mockResolvedValueOnce({ reply: 'You have 3 classes today.', mutated: [] });

    const res = await request(app)
      .post('/api/v1/agent/chat')
      .send({ message: 'what classes do I have today' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: 'You have 3 classes today.', mutated: [] });
    expect(mockRunAgent).toHaveBeenCalledWith('what classes do I have today', []);
  });

  it('passes history through to runAgent when provided', async () => {
    mockRunAgent.mockResolvedValueOnce({ reply: 'Booked.', mutated: ['rooms'] });
    const history = [
      { role: 'user', text: 'hi' },
      { role: 'model', text: 'hello' }
    ];

    const res = await request(app).post('/api/v1/agent/chat').send({ message: 'book it', history });

    expect(res.status).toBe(200);
    expect(mockRunAgent).toHaveBeenCalledWith('book it', history);
  });

  it('returns 400 on a missing message and never calls runAgent', async () => {
    const res = await request(app).post('/api/v1/agent/chat').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockRunAgent).not.toHaveBeenCalled();
  });

  it('returns 400 on a blank message and never calls runAgent', async () => {
    const res = await request(app).post('/api/v1/agent/chat').send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(mockRunAgent).not.toHaveBeenCalled();
  });

  it('returns 400 on a malformed history entry and never calls runAgent', async () => {
    const res = await request(app)
      .post('/api/v1/agent/chat')
      .send({ message: 'hi', history: [{ role: 'narrator', text: 'once upon a time' }] });

    expect(res.status).toBe(400);
    expect(mockRunAgent).not.toHaveBeenCalled();
  });
});
