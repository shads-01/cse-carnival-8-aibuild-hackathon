import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { ApiError } from './utils/apiResponse';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);

// HTTP request logger
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Handle 404 for unknown endpoints
app.use('*', (_req, _res, next) => {
  next(ApiError.notFound('Requested API endpoint does not exist'));
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
