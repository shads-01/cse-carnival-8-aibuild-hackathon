import { Type, type FunctionDeclaration } from '@google/genai';
import { ApiError } from '../utils/apiResponse';
import { announcementService } from '../services/announcementService';
import { assignmentService } from '../services/assignmentService';
import { eventService } from '../services/eventService';
import { roomService } from '../services/roomService';
import { scheduleService } from '../services/scheduleService';
import type { BookRoomDto, FindAvailableRoomsDto, RegisterEventDto } from '@shared/types';

export type ToolResult = Record<string, unknown>;
export type ToolArgs = Record<string, unknown>;
export type ToolHandler = (args: ToolArgs) => Promise<ToolResult>;

export interface ToolDefinition {
  declaration: FunctionDeclaration;
  handler: ToolHandler;
  /**
   * Resource types this tool writes to on success — runAgent.ts unions these into the
   * response's `mutated` field so the client knows which campusStore slices to refetch.
   * Read-only tools carry an empty array.
   */
  mutates: string[];
}

// ---------------------------------------------------------------------------
// Helpers — every handler routes through these so no thrown exception (from a
// stub/service call, or from a bug) ever reaches the Gemini loop directly, and
// every "missing required param" case looks the same to the caller.
// ---------------------------------------------------------------------------

function errorResult(message: string): ToolResult {
  return { error: message };
}

function missingRequired(args: ToolArgs, keys: string[]): string[] {
  return keys.filter((key) => {
    const value = args[key];
    return value === undefined || value === null || value === '';
  });
}

async function safeCall(fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return errorResult(err.message);
    }
    return errorResult(err instanceof Error ? err.message : 'Unexpected error handling this request.');
  }
}

function str(args: ToolArgs, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

function strArray(args: ToolArgs, key: string): string[] | undefined {
  const value = args[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : undefined;
}

function num(args: ToolArgs, key: string): number | undefined {
  const value = args[key];
  return typeof value === 'number' ? value : undefined;
}

// ---------------------------------------------------------------------------
// Tool definitions — parameter names match Postgres column names 1:1, per
// ARCHITECTURE.md's Agent tool contract.
// ---------------------------------------------------------------------------

export const tools: ToolDefinition[] = [
  {
    mutates: [],
    declaration: {
      name: 'get_schedule',
      description: 'Look up class schedule entries, optionally filtered by course code and/or day of week.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          course: { type: Type.STRING, description: 'Course code, e.g. "CSE 4113". Matches partially.' },
          day: {
            type: Type.STRING,
            description: 'Day of week: Sunday, Monday, Tuesday, Wednesday, or Thursday.'
          }
        }
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const schedule = await scheduleService.list({ course: str(args, 'course'), day: str(args, 'day') });
        return { schedule };
      })
  },

  {
    mutates: [],
    declaration: {
      name: 'get_assignments',
      description: 'Look up assignments, optionally filtered by course code and/or status.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          course: { type: Type.STRING, description: 'Course code, e.g. "CSE 4113". Matches partially.' },
          status: {
            type: Type.STRING,
            description: 'Assignment status: pending, submitted, graded, or late.'
          }
        }
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const assignments = await assignmentService.list({
          course: str(args, 'course'),
          status: str(args, 'status')
        });
        return { assignments };
      })
  },

  {
    mutates: [],
    declaration: {
      name: 'get_events',
      description: 'Look up campus events, optionally filtered by date and/or status.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format.' },
          status: {
            type: Type.STRING,
            description: 'Event status: upcoming, ongoing, completed, cancelled, or full.'
          }
        }
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const events = await eventService.list({ date: str(args, 'date'), status: str(args, 'status') });
        return { events };
      })
  },

  {
    mutates: [],
    declaration: {
      name: 'get_announcements',
      description: 'Look up campus announcements, optionally filtered by priority.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, description: 'Announcement priority: high, medium, or low.' }
        }
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const announcements = await announcementService.list({ priority: str(args, 'priority') });
        return { announcements };
      })
  },

  {
    mutates: [],
    declaration: {
      name: 'find_available_rooms',
      description:
        'Find rooms with no conflicting booking in a given date/time window, optionally filtered by minimum capacity and required equipment.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format.' },
          start_time: { type: Type.STRING, description: '24-hour start time, HH:mm.' },
          end_time: { type: Type.STRING, description: '24-hour end time, HH:mm.' },
          min_capacity: { type: Type.INTEGER, description: 'Minimum room capacity required.' },
          equipment: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Equipment the room must have, e.g. ["projector"].'
          }
        },
        required: ['date', 'start_time', 'end_time']
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const missing = missingRequired(args, ['date', 'start_time', 'end_time']);
        if (missing.length > 0) {
          return errorResult(
            `Missing required parameter(s) to search for rooms: ${missing.join(', ')}. Ask the user for the exact date and time window.`
          );
        }

        const dto: FindAvailableRoomsDto = {
          date: str(args, 'date')!,
          start_time: str(args, 'start_time')!,
          end_time: str(args, 'end_time')!,
          min_capacity: num(args, 'min_capacity'),
          equipment: strArray(args, 'equipment')
        };
        const rooms = await roomService.findAvailable(dto);
        return { rooms };
      })
  },

  {
    mutates: ['rooms'],
    declaration: {
      name: 'book_room',
      description: 'Book a room for a specific date and time window. All parameters are required.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          room_id: { type: Type.STRING, description: 'Room id or room number, e.g. "7A02".' },
          date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format.' },
          start_time: { type: Type.STRING, description: '24-hour start time, HH:mm.' },
          end_time: { type: Type.STRING, description: '24-hour end time, HH:mm.' },
          booked_by: { type: Type.STRING, description: 'Name of the person or org booking the room.' },
          purpose: { type: Type.STRING, description: 'Reason for the booking.' }
        },
        required: ['room_id', 'date', 'start_time', 'end_time', 'booked_by', 'purpose']
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const missing = missingRequired(args, [
          'room_id',
          'date',
          'start_time',
          'end_time',
          'booked_by',
          'purpose'
        ]);
        if (missing.length > 0) {
          return errorResult(
            `Missing required parameter(s) to book a room: ${missing.join(', ')}. Ask the user for these before booking — never guess or default them.`
          );
        }

        const dto: BookRoomDto = {
          room_id: str(args, 'room_id')!,
          date: str(args, 'date')!,
          start_time: str(args, 'start_time')!,
          end_time: str(args, 'end_time')!,
          booked_by: str(args, 'booked_by')!,
          purpose: str(args, 'purpose')!
        };
        const booking = await roomService.book(dto);
        return { booking };
      })
  },

  {
    mutates: ['rooms'],
    declaration: {
      name: 'cancel_booking',
      description:
        "Cancel an existing room booking. booked_by must match the booking's owner — cancelling someone else's booking is refused.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          booking_id: { type: Type.STRING, description: 'The booking id to cancel.' },
          booked_by: { type: Type.STRING, description: "The requester's name — must match the booking's owner." }
        },
        required: ['booking_id', 'booked_by']
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const missing = missingRequired(args, ['booking_id', 'booked_by']);
        if (missing.length > 0) {
          return errorResult(`Missing required parameter(s) to cancel a booking: ${missing.join(', ')}.`);
        }

        await roomService.cancelBooking(str(args, 'booking_id')!, str(args, 'booked_by'));
        return { cancelled: true, booking_id: str(args, 'booking_id') };
      })
  },

  {
    mutates: ['events'],
    declaration: {
      name: 'register_for_event',
      description: 'Register a student for a campus event. Fails if the event is at capacity or already registered.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          event_id: { type: Type.STRING, description: 'The event id to register for.' },
          student_id: { type: Type.STRING, description: "The student's ID." },
          name: { type: Type.STRING, description: "The student's name." }
        },
        required: ['event_id', 'student_id', 'name']
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const missing = missingRequired(args, ['event_id', 'student_id', 'name']);
        if (missing.length > 0) {
          return errorResult(`Missing required parameter(s) to register for this event: ${missing.join(', ')}.`);
        }

        const dto: RegisterEventDto = {
          event_id: str(args, 'event_id')!,
          student_id: str(args, 'student_id')!,
          name: str(args, 'name')!
        };
        const registration = await eventService.register(dto);
        return { registration };
      })
  },

  {
    mutates: ['events'],
    declaration: {
      name: 'cancel_registration',
      description:
        "Cancel a student's event registration. student_id must match the registration being cancelled — cancelling someone else's registration is refused.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          event_id: { type: Type.STRING, description: 'The event id.' },
          student_id: { type: Type.STRING, description: "The student's ID — must match the registration's owner." }
        },
        required: ['event_id', 'student_id']
      }
    },
    handler: (args) =>
      safeCall(async () => {
        const missing = missingRequired(args, ['event_id', 'student_id']);
        if (missing.length > 0) {
          return errorResult(`Missing required parameter(s) to cancel this registration: ${missing.join(', ')}.`);
        }

        await eventService.cancelRegistration(str(args, 'event_id')!, str(args, 'student_id')!);
        return { cancelled: true, event_id: str(args, 'event_id'), student_id: str(args, 'student_id') };
      })
  }
];

export function getToolDeclarations(): FunctionDeclaration[] {
  return tools.map((t) => t.declaration);
}

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return tools.find((t) => t.declaration.name === name);
}
