import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import agentRoutes from './agent.routes';
import { getHealth } from '../../controllers/health.controller';

const v1Router = Router();

v1Router.get('/health', getHealth);
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/agent', agentRoutes);

export default v1Router;
