import { describe, it, expect, vi, beforeEach } from 'vitest';

// Two fake keys so rotation has somewhere to rotate to.
vi.mock('../config', () => ({
  config: {
    gemini: { apiKeys: ['key-1', 'key-2'] }
  }
}));

// Track one generateContent mock per GoogleGenAI instance the module under
// test constructs (one per configured key), in construction order.
const generateContentMocks: Array<ReturnType<typeof vi.fn>> = [];

vi.mock('@google/genai', () => {
  class ApiError extends Error {
    status: number;
    constructor(options: { message: string; status: number }) {
      super(options.message);
      this.name = 'ApiError';
      this.status = options.status;
    }
  }

  class GoogleGenAI {
    models: { generateContent: ReturnType<typeof vi.fn> };
    constructor() {
      const generateContent = vi.fn();
      generateContentMocks.push(generateContent);
      this.models = { generateContent };
    }
  }

  return { GoogleGenAI, ApiError };
});

describe('llmClient key rotation', () => {
  beforeEach(() => {
    vi.resetModules();
    generateContentMocks.length = 0;
  });

  it('rotates to the next key on a 429 and returns the successful result', async () => {
    const { generateContent } = await import('./llmClient.js');
    const { ApiError } = await import('@google/genai');

    generateContentMocks[0].mockRejectedValueOnce(
      new ApiError({ message: 'rate limited', status: 429 })
    );
    generateContentMocks[1].mockResolvedValueOnce({ text: 'ok from key 2' });

    const result = await generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hi'
    } as never);

    expect(result).toEqual({ text: 'ok from key 2' });
    expect(generateContentMocks[0]).toHaveBeenCalledTimes(1);
    expect(generateContentMocks[1]).toHaveBeenCalledTimes(1);
  });

  it('stays on the rotated key for later calls instead of rotating back (sticky)', async () => {
    const { generateContent } = await import('./llmClient.js');
    const { ApiError } = await import('@google/genai');

    generateContentMocks[0].mockRejectedValueOnce(
      new ApiError({ message: 'rate limited', status: 429 })
    );
    generateContentMocks[1].mockResolvedValue({ text: 'ok from key 2' });

    await generateContent({ model: 'gemini-2.5-flash', contents: 'first' } as never);
    await generateContent({ model: 'gemini-2.5-flash', contents: 'second' } as never);

    expect(generateContentMocks[0]).toHaveBeenCalledTimes(1);
    expect(generateContentMocks[1]).toHaveBeenCalledTimes(2);
  });

  it('does not rotate on a non-429 error — it throws immediately', async () => {
    const { generateContent } = await import('./llmClient.js');

    generateContentMocks[0].mockRejectedValueOnce(new Error('bad request'));

    await expect(
      generateContent({ model: 'gemini-2.5-flash', contents: 'hi' } as never)
    ).rejects.toThrow('bad request');
    expect(generateContentMocks[1]).not.toHaveBeenCalled();
  });

  it('throws the last error once every key has hit its rate limit', async () => {
    const { generateContent } = await import('./llmClient.js');
    const { ApiError } = await import('@google/genai');

    generateContentMocks[0].mockRejectedValueOnce(
      new ApiError({ message: 'rate limited on key 1', status: 429 })
    );
    generateContentMocks[1].mockRejectedValueOnce(
      new ApiError({ message: 'rate limited on key 2', status: 429 })
    );

    await expect(
      generateContent({ model: 'gemini-2.5-flash', contents: 'hi' } as never)
    ).rejects.toThrow('rate limited on key 2');
  });
});
