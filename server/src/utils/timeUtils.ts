/**
 * Time and Timezone Utility for CampusOS
 * Ensures timezone-safety, ISO 8601 UTC normalization, and strict validation.
 */

export interface NormalizedTimeRange {
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  startTime: string;   // HH:mm:ss
  endTime: string;     // HH:mm:ss
  startIsoUtc: string; // YYYY-MM-DDTHH:mm:ss.sssZ
  endIsoUtc: string;   // YYYY-MM-DDTHH:mm:ss.sssZ
  startEpochMs: number;
  endEpochMs: number;
}

/**
 * Parses any incoming date + time or ISO 8601 string into a valid UTC Date object.
 */
export function parseToUtcDate(timeInput: string, dateInput?: string): Date {
  if (!timeInput) {
    throw new Error('Time input is required');
  }

  // 1. Full ISO 8601 datetime string (e.g., 2026-09-07T13:00:00Z or 2026-09-07T19:00:00+06:00)
  if (timeInput.includes('T')) {
    const d = new Date(timeInput);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid ISO datetime string: "${timeInput}"`);
    }
    return d;
  }

  // 2. Date + Time (HH:mm or HH:mm:ss)
  const dateStr = dateInput || new Date().toISOString().split('T')[0];
  const timeParts = timeInput.trim().split(':');
  if (timeParts.length < 2) {
    throw new Error(`Invalid time format: "${timeInput}". Expected HH:mm or HH:mm:ss`);
  }

  const hours = timeParts[0].padStart(2, '0');
  const minutes = timeParts[1].padStart(2, '0');
  const seconds = timeParts[2] ? timeParts[2].padStart(2, '0') : '00';

  // Construct standard ISO 8601 UTC representation
  const isoUtcStr = `${dateStr}T${hours}:${minutes}:${seconds}Z`;
  const d = new Date(isoUtcStr);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date/time combination: "${dateStr} ${timeInput}"`);
  }
  return d;
}

/**
 * Converts a date and time string directly to an ISO 8601 UTC string.
 */
export function toUtcIsoString(timeInput: string, dateInput?: string): string {
  return parseToUtcDate(timeInput, dateInput).toISOString();
}

/**
 * Normalizes start and end time inputs to strict UTC ISO 8601 representations
 * and validates that end_time is strictly after start_time.
 */
export function normalizeAndValidateTimeRange(
  startTimeInput: string,
  endTimeInput: string,
  dateInput: string,
  endDateInput?: string
): NormalizedTimeRange {
  const startDateObj = parseToUtcDate(startTimeInput, dateInput);
  const endDateObj = parseToUtcDate(endTimeInput, endDateInput || dateInput);

  const startEpochMs = startDateObj.getTime();
  const endEpochMs = endDateObj.getTime();

  if (endEpochMs <= startEpochMs) {
    throw new Error(
      `Invalid time range: end_time (${endDateObj.toISOString()}) must be strictly after start_time (${startDateObj.toISOString()})`
    );
  }

  const startIsoUtc = startDateObj.toISOString();
  const endIsoUtc = endDateObj.toISOString();

  const startDate = startIsoUtc.split('T')[0];
  const startTime = startIsoUtc.split('T')[1].substring(0, 8); // HH:mm:ss

  const endDate = endIsoUtc.split('T')[0];
  const endTime = endIsoUtc.split('T')[1].substring(0, 8); // HH:mm:ss

  return {
    startDate,
    endDate,
    startTime,
    endTime,
    startIsoUtc,
    endIsoUtc,
    startEpochMs,
    endEpochMs
  };
}

/**
 * Evaluates whether two time ranges overlap in UTC.
 * Uses strict standard: (range1.start < range2.end) && (range1.end > range2.start)
 * Abutting intervals (start === end) do NOT overlap.
 */
export function doTimeRangesOverlap(
  range1: { startEpochMs: number; endEpochMs: number },
  range2: { startEpochMs: number; endEpochMs: number }
): boolean {
  return range1.startEpochMs < range2.endEpochMs && range1.endEpochMs > range2.startEpochMs;
}
