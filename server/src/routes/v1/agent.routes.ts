import { Router } from 'express';
import { AgentController } from '../../controllers/agent.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { agentChatSchema } from '../../validators/agent.validator';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const agentController = new AgentController();

router.post('/chat', validateRequest(agentChatSchema), asyncHandler(agentController.chat));

export default router;
