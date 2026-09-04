import type { Content } from '@google/genai';
import { generateContent } from './llmClient';
import { buildSystemPrompt } from './systemPrompt';
import { getToolDeclarations, getToolDefinition } from './tools';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface RunAgentResult {
  reply: string;
  /** Resource types (e.g. "rooms", "events") any tool call this turn actually wrote to. */
  mutated: string[];
}

const MODEL = 'gemini-3.6-flash';

// Guards against a runaway function-calling loop (a tool that keeps getting
// re-invoked without ever resolving) — five rounds comfortably covers every
// sample query, which is at most a two-step read-then-act.
const MAX_TOOL_ROUNDS = 5;

function toContents(message: string, history: ChatTurn[]): Content[] {
  const contents: Content[] = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

/**
 * Runs the Gemini tool-use loop for one chat turn: builds a fresh system
 * prompt (so "today"/"tomorrow" always resolve against the current server
 * clock), sends the conversation plus the 9 tool declarations, executes any
 * function calls Gemini requests via tools.ts, feeds the results back, and
 * repeats until Gemini returns a final text reply.
 */
export async function runAgent(message: string, history: ChatTurn[] = []): Promise<RunAgentResult> {
  const contents = toContents(message, history);
  const mutated = new Set<string>();
  const systemInstruction = buildSystemPrompt(new Date());
  const tools = [{ functionDeclarations: getToolDeclarations() }];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction, tools }
    });

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return { reply: response.text ?? '', mutated: Array.from(mutated) };
    }

    // Echo the model's own function-call turn back verbatim (not a reconstruction
    // from response.functionCalls) before appending results, so the next round sees
    // the full exchange. This matters beyond just `functionCall`/`args`: newer models
    // attach a `thoughtSignature` to each function-call part, and the API rejects the
    // next call if that signature isn't echoed back unchanged.
    const modelTurn = response.candidates?.[0]?.content ?? {
      role: 'model',
      parts: functionCalls.map((call) => ({ functionCall: call }))
    };
    contents.push(modelTurn);

    const responseParts = await Promise.all(
      functionCalls.map(async (call) => {
        const name = call.name ?? '';
        const definition = getToolDefinition(name);

        const result = definition
          ? await definition.handler(call.args ?? {})
          : { error: `No tool named "${name}" is available.` };

        if (definition && !('error' in result)) {
          definition.mutates.forEach((resource) => mutated.add(resource));
        }

        return { functionResponse: { name, response: result } };
      })
    );

    contents.push({ role: 'user', parts: responseParts });
  }

  return {
    reply:
      "I wasn't able to finish that after several tool calls — could you rephrase or simplify the request?",
    mutated: Array.from(mutated)
  };
}
