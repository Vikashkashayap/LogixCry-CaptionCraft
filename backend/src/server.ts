import app from './app';
import { CONFIG } from './config';
import { connectDB } from './config/db';
import { runStorageRetentionCleaner } from './utils/fileCleanup';

async function bootstrap() {
  // Connect to MongoDB Atlas
  await connectDB();

  const server = app.listen(CONFIG.PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 AI Video Caption Generator Backend Running!`);
    console.log(`📡 Port: ${CONFIG.PORT}`);
    console.log(`🤖 AI Provider: ${CONFIG.OPENROUTER_API_KEY ? 'OpenRouter (Gemini Flash)' : 'Google GenAI SDK'}`);
    console.log(`🧠 AI Model: ${CONFIG.GEMINI_MODEL}`);
    console.log(`📁 Uploads: ${CONFIG.UPLOAD_DIR}`);
    console.log(`📁 Outputs: ${CONFIG.OUTPUT_DIR}`);
    console.log(`==================================================`);
  });

  // Run storage retention cleaner every 60 minutes
  setInterval(() => {
    console.log('[Storage Retention] Running scheduled cleanup...');
    runStorageRetentionCleaner();
  }, 60 * 60 * 1000);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

bootstrap().catch((err) => {
  console.error('[Server Bootstrap Fatal Error]:', err);
});
