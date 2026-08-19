import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { CONFIG } from './config';
import captionRoutes from './routes/captionRoutes';
import { errorHandler } from './middleware/errorHandler';
import { ensureDirsExist } from './utils/fileCleanup';

// Ensure storage directories exist
ensureDirsExist();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: CONFIG.FRONTEND_URL || '*',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for generation endpoint
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many caption requests from this IP, please try again after 15 minutes.',
    },
  },
});

app.use('/api/captions/generate', apiLimiter);

// Register API routes
app.use('/api/captions', captionRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Video Caption Generator API',
    model: CONFIG.GEMINI_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
