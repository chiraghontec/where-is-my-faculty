import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/faculty_db',

  azure: {
    tenantId: process.env.AZURE_TENANT_ID ?? '',
    clientId: process.env.AZURE_CLIENT_ID ?? '',
    clientSecret: process.env.AZURE_CLIENT_SECRET ?? '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID ?? 'common'}`,
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY ?? '24h',
  },

  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES ?? '5', 10),
    concurrency: parseInt(process.env.SYNC_CONCURRENCY ?? '10', 10),
    lookaheadDays: parseInt(process.env.SYNC_LOOKAHEAD_DAYS ?? '7', 10),
  },

  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
  },
};
