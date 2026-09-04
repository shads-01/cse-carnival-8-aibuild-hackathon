import app from './src/app';
import { config } from './src/config';
import { logger } from './src/utils/logger';

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🚀 Server running in ${config.env} mode on http://0.0.0.0:${config.port}`);
  logger.info(`📡 API Base URL: http://localhost:${config.port}/api/v1`);
});

const handleShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection:', reason);
});
