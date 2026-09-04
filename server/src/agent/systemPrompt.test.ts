import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildSystemPrompt } from './systemPrompt';

describe('buildSystemPrompt', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('injects the literal current-date + weekday line for the given date', () => {
    // 2024-01-01 is a known Monday.
    const prompt = buildSystemPrompt(new Date(2024, 0, 1));
    expect(prompt).toContain('Current date: 2024-01-01 (Monday).');
  });

  it('produces a different date line for a different date — proves it is computed per call, not baked in', () => {
    const first = buildSystemPrompt(new Date(2024, 0, 1));
    const second = buildSystemPrompt(new Date(2024, 0, 2)); // Tuesday

    expect(second).toContain('Current date: 2024-01-02 (Tuesday).');
    expect(second).not.toBe(first);
  });

  it('defaults to the current system time when no date is passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 4)); // 2026-09-04 is a Friday

    const prompt = buildSystemPrompt();

    expect(prompt).toContain('Current date: 2026-09-04 (Friday).');
  });

  it('states all four behavior rules', () => {
    const prompt = buildSystemPrompt(new Date(2024, 0, 1));

    expect(prompt).toMatch(/never answer from memory/i);
    expect(prompt).toMatch(/ask, don't guess/i);
    expect(prompt).toMatch(/refuse when unauthorized or unmatched/i);
    expect(prompt).toMatch(/confirm before destructive or irreversible actions/i);
  });

  it('notes that tool parameters use snake_case column names, not start/end', () => {
    const prompt = buildSystemPrompt(new Date(2024, 0, 1));

    expect(prompt).toMatch(/start_time\/end_time/);
    expect(prompt).toMatch(/never start\/end/);
  });

  it('notes the campus week runs Sunday-Thursday', () => {
    const prompt = buildSystemPrompt(new Date(2024, 0, 1));

    expect(prompt).toMatch(/Sunday-Thursday/);
  });
});
