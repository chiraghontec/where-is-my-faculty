import { createLogger, format, transports } from 'winston';
import { config } from '../config';

const logger = createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    config.nodeEnv === 'production'
      ? format.json()
      : format.printf(({ timestamp, level, message, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level.toUpperCase()}: ${message}${extra}`;
        })
  ),
  transports: [new transports.Console()],
});

export default logger;
