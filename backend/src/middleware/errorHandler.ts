import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  console.error('[Global Error Handler]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: message.includes('MulterError') || statusCode < 500 ? message : 'An unexpected error occurred while processing the video.',
    },
  });
}
