import { describe, it, expect } from 'vitest';
import {
  parseToUtcDate,
  toUtcIsoString,
  normalizeAndValidateTimeRange,
  doTimeRangesOverlap
} from './timeUtils';

describe('Time and Timezone Handling Hardening Tests', () => {
  describe('parseToUtcDate & toUtcIsoString', () => {
    it('should parse standard HH:mm with date to UTC', () => {
      const dateObj = parseToUtcDate('14:30', '2026-09-07');
      expect(dateObj.toISOString()).toBe('2026-09-07T14:30:00.000Z');
      expect(toUtcIsoString('14:30', '2026-09-07')).toBe('2026-09-07T14:30:00.000Z');
    });

    it('should parse ISO 8601 UTC string directly', () => {
      const iso = '2026-09-07T14:30:00.000Z';
      const dateObj = parseToUtcDate(iso);
      expect(dateObj.toISOString()).toBe(iso);
    });

    it('should normalize timezone-offset strings (+06:00) to UTC ISO', () => {
      const offsetIso = '2026-09-07T20:30:00+06:00';
      const dateObj = parseToUtcDate(offsetIso);
      expect(dateObj.toISOString()).toBe('2026-09-07T14:30:00.000Z');
    });

    it('should throw on invalid format', () => {
      expect(() => parseToUtcDate('invalid')).toThrow();
    });
  });

  describe('normalizeAndValidateTimeRange', () => {
    it('should validate and normalize valid ascending time range', () => {
      const normalized = normalizeAndValidateTimeRange('14:00', '16:00', '2026-09-07');
      expect(normalized.startDate).toBe('2026-09-07');
      expect(normalized.startTime).toBe('14:00:00');
      expect(normalized.endTime).toBe('16:00:00');
      expect(normalized.startIsoUtc).toBe('2026-09-07T14:00:00.000Z');
      expect(normalized.endIsoUtc).toBe('2026-09-07T16:00:00.000Z');
      expect(normalized.endEpochMs).toBeGreaterThan(normalized.startEpochMs);
    });

    it('should reject inverted range (end_time <= start_time)', () => {
      expect(() =>
        normalizeAndValidateTimeRange('16:00', '14:00', '2026-09-07')
      ).toThrow(/Invalid time range/);
    });

    it('should reject equal start and end times', () => {
      expect(() =>
        normalizeAndValidateTimeRange('14:00', '14:00', '2026-09-07')
      ).toThrow(/Invalid time range/);
    });

    it('should handle full ISO strings with timezone offsets and validate UTC ordering', () => {
      // 15:00 UTC vs 16:00 UTC
      const normalized = normalizeAndValidateTimeRange(
        '2026-09-07T21:00:00+06:00',
        '2026-09-07T22:00:00+06:00',
        '2026-09-07'
      );
      expect(normalized.startIsoUtc).toBe('2026-09-07T15:00:00.000Z');
      expect(normalized.endIsoUtc).toBe('2026-09-07T16:00:00.000Z');
    });
  });

  describe('doTimeRangesOverlap', () => {
    const base = normalizeAndValidateTimeRange('14:00', '16:00', '2026-09-07');

    it('should detect exact overlap', () => {
      const target = normalizeAndValidateTimeRange('14:00', '16:00', '2026-09-07');
      expect(doTimeRangesOverlap(base, target)).toBe(true);
    });

    it('should detect enclosing overlap', () => {
      const target = normalizeAndValidateTimeRange('13:00', '17:00', '2026-09-07');
      expect(doTimeRangesOverlap(base, target)).toBe(true);
    });

    it('should detect partial left and right overlap', () => {
      const left = normalizeAndValidateTimeRange('13:00', '15:00', '2026-09-07');
      const right = normalizeAndValidateTimeRange('15:00', '17:00', '2026-09-07');
      expect(doTimeRangesOverlap(base, left)).toBe(true);
      expect(doTimeRangesOverlap(base, right)).toBe(true);
    });

    it('should ALLOW abutting intervals (adjacent boundary)', () => {
      const adjacentLeft = normalizeAndValidateTimeRange('12:00', '14:00', '2026-09-07');
      const adjacentRight = normalizeAndValidateTimeRange('16:00', '18:00', '2026-09-07');
      expect(doTimeRangesOverlap(base, adjacentLeft)).toBe(false);
      expect(doTimeRangesOverlap(base, adjacentRight)).toBe(false);
    });
  });
});
