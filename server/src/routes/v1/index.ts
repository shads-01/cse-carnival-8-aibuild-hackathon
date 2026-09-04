import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import scheduleRoutes from './schedule.routes';
import roomRoutes from './room.routes';
import eventRoutes from './event.routes';
import announcementRoutes from './announcement.routes';
import assignmentRoutes from './assignment.routes';
import { getHealth } from '../../controllers/health.controller';

const v1Router = Router();

v1Router.get('/health', getHealth);
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);

// CampusOS 5 Systems Routes
v1Router.use('/schedules', scheduleRoutes);
v1Router.use('/rooms', roomRoutes);
v1Router.use('/events', eventRoutes);
v1Router.use('/announcements', announcementRoutes);
v1Router.use('/assignments', assignmentRoutes);

export default v1Router;
