import { Router } from 'express';
import { scheduleController } from '../../controllers/schedule.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createScheduleSchema, updateScheduleSchema } from '../../validators/schedule.validator';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(scheduleController.list));
router.get('/:id', asyncHandler(scheduleController.getById));
router.post('/', validateRequest(createScheduleSchema), asyncHandler(scheduleController.create));
router.put('/:id', validateRequest(updateScheduleSchema), asyncHandler(scheduleController.update));
router.delete('/:id', asyncHandler(scheduleController.delete));

export default router;
