import { Request, Response } from 'express';
import { runAgent, type ChatTurn } from '../agent/runAgent';

export class AgentController {
  chat = async (req: Request, res: Response): Promise<void> => {
    const { message, history } = req.body as { message: string; history?: ChatTurn[] };

    const result = await runAgent(message, history ?? []);

    // Deliberately NOT the sendResponse envelope used by the other controllers —
    // ARCHITECTURE.md's REST API surface pins this endpoint's response to exactly
    // { reply, mutated }, since ChatPanel.tsx is built against that literal contract.
    res.status(200).json(result);
  };
}
