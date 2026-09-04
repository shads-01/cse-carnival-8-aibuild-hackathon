import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { loginSchema, registerSchema, oauthCallbackSchema } from '../../validators/auth.validator';
import { authenticate } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const authController = new AuthController();

router.post('/login', validateRequest(loginSchema), asyncHandler(authController.login));
router.post('/register', validateRequest(registerSchema), asyncHandler(authController.register));
router.post(
  '/oauth/callback',
  validateRequest(oauthCallbackSchema),
  asyncHandler(authController.oauthCallback)
);
router.get('/me', asyncHandler(authenticate), asyncHandler(authController.getMe));

export default router;
