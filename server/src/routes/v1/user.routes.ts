import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../../validators/user.validator';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { UserRole } from '@shared/types';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(asyncHandler(authenticate));

router.get('/', asyncHandler(userController.getUsers));
router.get('/:id', asyncHandler(userController.getUserById));

router.post(
  '/',
  authorize(UserRole.ADMIN),
  validateRequest(createUserSchema),
  asyncHandler(userController.createUser)
);

router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(updateUserSchema),
  asyncHandler(userController.updateUser)
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  asyncHandler(userController.deleteUser)
);

export default router;
