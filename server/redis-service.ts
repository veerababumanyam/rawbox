import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isReady) {
    await redisClient.connect();
    console.log('Redis connected!');
  }
};

export { redisClient };
export default redisClient;
