import { Router } from 'express';
import { assignmentController } from '../../controllers/assignment.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createAssignmentSchema, updateAssignmentSchema } from '../../validators/assignment.validator';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(assignmentController.list));
router.get('/:id', asyncHandler(assignmentController.getById));
router.post('/', validateRequest(createAssignmentSchema), asyncHandler(assignmentController.create));
router.put('/:id', validateRequest(updateAssignmentSchema), asyncHandler(assignmentController.update));
router.delete('/:id', asyncHandler(assignmentController.delete));

export default router;
