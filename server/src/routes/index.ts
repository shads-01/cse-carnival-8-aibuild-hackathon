import { Router } from 'express';
import v1Router from './v1';

const mainRouter = Router();

mainRouter.use('/v1', v1Router);
// Fallback for unversioned health endpoint
mainRouter.use('/', v1Router);

export default mainRouter;
