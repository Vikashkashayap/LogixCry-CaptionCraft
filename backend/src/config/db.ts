import mongoose from 'mongoose';
import { CONFIG } from './index';

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!CONFIG.MONGO_URI) {
    console.warn('[MongoDB] MONGO_URI is not set. Running with in-memory job store only.');
    return null;
  }

  if (isConnected) {
    return mongoose;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas cluster...');
    const conn = await mongoose.connect(CONFIG.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to Database: ${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // We do not crash the app; in-memory store remains active
    return null;
  }
}

export function isDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
