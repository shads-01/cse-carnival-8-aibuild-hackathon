import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('./llmClient', () => ({
  generateContent: vi.fn()
}));

vi.mock('./tools', () => ({
  getToolDeclarations: vi.fn(() => []),
  getToolDefinition: vi.fn()
}));

import { generateContent } from './llmClient';
import { getToolDefinition } from './tools';
import { runAgent } from './runAgent';

const mockGenerateContent = generateContent as unknown as Mock;
const mockGetToolDefinition = getToolDefinition as unknown as Mock;

beforeEach(() => {
  mockGenerateContent.mockReset();
  mockGetToolDefinition.mockReset();
});

describe('runAgent — no tool call', () => {
  it('returns the plain text reply and an empty mutated list', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'You have 3 classes today.', functionCalls: undefined });

    const result = await runAgent('what classes do I have today');

    expect(result).toEqual({ reply: 'You have 3 classes today.', mutated: [] });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});

describe('runAgent — one tool call', () => {
  it('executes the tool, feeds the result back, and returns the final text', async () => {
    const handler = vi.fn().mockResolvedValue({ rooms: [{ id: 'room-001', room_number: '7A02' }] });
    mockGetToolDefinition.mockReturnValue({ handler, mutates: [] });

    mockGenerateContent
      .mockResolvedValueOnce({
        text: undefined,
        functionCalls: [
          {
            name: 'find_available_rooms',
            args: { date: '2026-09-05', start_time: '15:00', end_time: '17:00' }
          }
        ]
      })
      .mockResolvedValueOnce({ text: 'Room 7A02 is free then.', functionCalls: undefined });

    const result = await runAgent("I'm free tomorrow 3-5, what's open?");

    expect(handler).toHaveBeenCalledWith({ date: '2026-09-05', start_time: '15:00', end_time: '17:00' });
    expect(result.reply).toBe('Room 7A02 is free then.');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    // The tool result must be echoed back to the model as a functionResponse part.
    const secondCallContents = mockGenerateContent.mock.calls[1][0].contents;
    const lastTurn = secondCallContents[secondCallContents.length - 1];
    expect(lastTurn.parts[0].functionResponse.response).toEqual({
      rooms: [{ id: 'room-001', room_number: '7A02' }]
    });
  });
});

describe('runAgent — mutated tracking', () => {
  it('collects the resource types only a successful, mutating tool call declares', async () => {
    const handler = vi.fn().mockResolvedValue({ booking: { id: 'bk-1' } });
    mockGetToolDefinition.mockReturnValue({ handler, mutates: ['rooms'] });

    mockGenerateContent
      .mockResolvedValueOnce({
        text: undefined,
        functionCalls: [{ name: 'book_room', args: { room_id: '7A02' } }]
      })
      .mockResolvedValueOnce({ text: 'Booked.', functionCalls: undefined });

    const result = await runAgent('book 7A02 tomorrow 3-5pm for the debate club, practice round');

    expect(result.mutated).toEqual(['rooms']);
  });

  it('does not mark a resource mutated when the tool call returns an error, even if it can mutate', async () => {
    const handler = vi.fn().mockResolvedValue({ error: 'Room 7A02 is already booked then.' });
    mockGetToolDefinition.mockReturnValue({ handler, mutates: ['rooms'] });

    mockGenerateContent
      .mockResolvedValueOnce({
        text: undefined,
        functionCalls: [{ name: 'book_room', args: { room_id: '7A02' } }]
      })
      .mockResolvedValueOnce({ text: 'That room is already booked then — want a different time?', functionCalls: undefined });

    const result = await runAgent('book 7A02 tomorrow 3-5pm for the debate club, practice round');

    expect(result.mutated).toEqual([]);
  });
});

describe('runAgent — tool errors never throw out of the loop', () => {
  it('a { error } tool result is fed back to the model as a functionResponse, not thrown', async () => {
    const handler = vi.fn().mockResolvedValue({ error: 'Room 7A02 is already booked then.' });
    mockGetToolDefinition.mockReturnValue({ handler, mutates: ['rooms'] });

    mockGenerateContent
      .mockResolvedValueOnce({
        text: undefined,
        functionCalls: [{ name: 'book_room', args: { room_id: '7A02' } }]
      })
      .mockResolvedValueOnce({
        text: 'That room is already booked then — want a different time?',
        functionCalls: undefined
      });

    await expect(
      runAgent('book 7A02 tomorrow 3-5pm for the debate club, practice round')
    ).resolves.toEqual({
      reply: 'That room is already booked then — want a different time?',
      mutated: []
    });

    const secondCallContents = mockGenerateContent.mock.calls[1][0].contents;
    const lastTurn = secondCallContents[secondCallContents.length - 1];
    expect(lastTurn.parts[0].functionResponse.response).toEqual({
      error: 'Room 7A02 is already booked then.'
    });
  });

  it('a call to a tool name the registry does not recognize is fed back as an error, not thrown', async () => {
    mockGetToolDefinition.mockReturnValue(undefined);

    mockGenerateContent
      .mockResolvedValueOnce({
        text: undefined,
        functionCalls: [{ name: 'delete_everything', args: {} }]
      })
      .mockResolvedValueOnce({ text: "I can't do that.", functionCalls: undefined });

    const result = await runAgent('delete everything');

    expect(result.reply).toBe("I can't do that.");
    const secondCallContents = mockGenerateContent.mock.calls[1][0].contents;
    const lastTurn = secondCallContents[secondCallContents.length - 1];
    expect(lastTurn.parts[0].functionResponse.response.error).toMatch(/no tool named/i);
  });
});

describe('runAgent — tool-call round limit', () => {
  it('stops after the round limit and returns a fallback reply instead of looping forever', async () => {
    const handler = vi.fn().mockResolvedValue({ rooms: [] });
    mockGetToolDefinition.mockReturnValue({ handler, mutates: [] });

    // Gemini keeps calling a tool every round, never settling on a final text reply.
    mockGenerateContent.mockResolvedValue({
      text: undefined,
      functionCalls: [{ name: 'find_available_rooms', args: {} }]
    });

    const result = await runAgent('find me a room');

    expect(result.reply).toMatch(/rephrase|simplify/i);
    expect(mockGenerateContent.mock.calls.length).toBeLessThanOrEqual(5);
  });
});
