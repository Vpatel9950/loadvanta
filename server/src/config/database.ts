import mongoose from 'mongoose';
import { config } from './env';

export async function connectDatabase(): Promise<typeof mongoose> {
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
  const uri = isTest ? 'mongodb://127.0.0.1:27017/loadvanta' : (process.env.TEST_MONGODB_URI || config.mongoUri);
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      autoIndex: true, // ensure indexes are created in dev
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    if (uri !== 'mongodb://127.0.0.1:27017/loadvanta') {
      try {
        console.warn('[Database] Cloud Atlas unreachable, attempting local MongoDB fallback (127.0.0.1:27017)...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/loadvanta', {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`[Database] Connected to local fallback MongoDB: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localErr) {
        // rethrow original
      }
    }
    console.error('[Database] Connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('[Database] Disconnected from MongoDB');
}
