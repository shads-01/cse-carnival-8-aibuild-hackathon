import { Router } from 'express';
import { eventController } from '../../controllers/event.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createEventSchema, updateEventSchema, registerEventSchema } from '../../validators/event.validator';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(eventController.list));
router.get('/:id', asyncHandler(eventController.getById));
router.post('/', validateRequest(createEventSchema), asyncHandler(eventController.create));
router.put('/:id', validateRequest(updateEventSchema), asyncHandler(eventController.update));
router.delete('/:id', asyncHandler(eventController.delete));

// Registration actions
router.post('/:id/register', validateRequest(registerEventSchema), asyncHandler(eventController.register));
router.post('/:id/registrations/:regId/cancel', asyncHandler(eventController.cancelRegistration));
router.post('/:id/cancel-registration', asyncHandler(eventController.cancelRegistration));

export default router;
