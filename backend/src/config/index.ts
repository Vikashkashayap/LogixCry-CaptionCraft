import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || (process.env.OPENROUTER_API_KEY ? 'google/gemini-2.5-flash' : 'gemini-2.5-flash'),
  MONGO_URI: process.env.MONGO_URI || '',
  MAX_VIDEO_SIZE_MB: process.env.MAX_VIDEO_SIZE_MB ? parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) : 200,
  MAX_VIDEO_DURATION_SECONDS: process.env.MAX_VIDEO_DURATION_SECONDS ? parseInt(process.env.MAX_VIDEO_DURATION_SECONDS, 10) : 300,
  UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  TEMP_DIR: path.resolve(process.env.TEMP_DIR || './temp'),
  OUTPUT_DIR: path.resolve(process.env.OUTPUT_DIR || './outputs'),
  CLEANUP_RETENTION_MS: process.env.CLEANUP_RETENTION_MS ? parseInt(process.env.CLEANUP_RETENTION_MS, 10) : 2 * 60 * 60 * 1000,
};
