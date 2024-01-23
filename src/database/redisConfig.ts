import Redis from 'ioredis';

// You can set these values in environment variables or configure them as needed
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  // You can add more configurations if needed, like password, etc.
});

export default redis;
