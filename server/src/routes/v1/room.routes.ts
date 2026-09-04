import { Router } from 'express';
import { roomController } from '../../controllers/room.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createRoomSchema, updateRoomSchema, bookRoomSchema, cancelBookingSchema } from '../../validators/room.validator';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(roomController.list));
router.get('/available', asyncHandler(roomController.findAvailable));
router.get('/:id', asyncHandler(roomController.getById));
router.post('/', validateRequest(createRoomSchema), asyncHandler(roomController.create));
router.put('/:id', validateRequest(updateRoomSchema), asyncHandler(roomController.update));
router.delete('/:id', asyncHandler(roomController.delete));

// Booking actions
router.post('/:id/book', asyncHandler(roomController.book));
router.post('/bookings/:id/cancel', validateRequest(cancelBookingSchema), asyncHandler(roomController.cancelBooking));

export default router;
