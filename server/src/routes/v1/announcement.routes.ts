import { Router } from 'express';
import { announcementController } from '../../controllers/announcement.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../../validators/announcement.validator';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(announcementController.list));
router.get('/:id', asyncHandler(announcementController.getById));
router.post('/', validateRequest(createAnnouncementSchema), asyncHandler(announcementController.create));
router.put('/:id', validateRequest(updateAnnouncementSchema), asyncHandler(announcementController.update));
router.delete('/:id', asyncHandler(announcementController.delete));

export default router;
