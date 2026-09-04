import {
  GoogleGenAI,
  ApiError,
  type GenerateContentParameters,
  type GenerateContentResponse
} from '@google/genai';
import { config } from '../config';
import { logger } from '../utils/logger';

// One GoogleGenAI client per configured API key. Never log the keys themselves —
// only the rotating index, for observability.
const clients = config.gemini.apiKeys.map((apiKey) => new GoogleGenAI({ apiKey }));

// Sticky forward pointer: once a key 429s, every later call starts from the
// next key onward. This is rotation-on-exhaustion, not per-request load
// balancing across keys.
let currentIndex = 0;

function isRetryableKeyError(err: unknown): boolean {
  // Originally 429-only, but a key can just as easily be dead for other
  // reasons (403 PERMISSION_DENIED on a denied/suspended project, a bad key
  // returning 400, a transient 5xx) — any of those should fall through to
  // the next configured key rather than wedging the whole rotation on
  // whichever key happens to sit at currentIndex.
  return err instanceof ApiError;
}

async function withKeyRotation<T>(call: (client: GoogleGenAI) => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < clients.length; attempt++) {
    try {
      return await call(clients[currentIndex]);
    } catch (err) {
      lastError = err;

      if (isRetryableKeyError(err) && attempt < clients.length - 1) {
        const nextIndex = (currentIndex + 1) % clients.length;
        const status = err instanceof ApiError ? err.status : 'unknown';
        logger.warn(
          `Gemini key #${currentIndex} failed (status ${status}) — rotating to key #${nextIndex}`
        );
        currentIndex = nextIndex;
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

/**
 * Generate content via Gemini, automatically rotating to the next configured
 * API key when the current one returns a 429 (rate limit). Mirrors the
 * Google GenAI SDK's own `ai.models.generateContent(...)` signature so
 * callers never need to know rotation is happening.
 */
export async function generateContent(
  params: GenerateContentParameters
): Promise<GenerateContentResponse> {
  return withKeyRotation((client) => client.models.generateContent(params));
}
