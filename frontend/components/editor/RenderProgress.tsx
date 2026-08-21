'use client';

import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface RenderProgressProps {
  status: 'idle' | 'rendering' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string | null;
}

export const RenderProgress: React.FC<RenderProgressProps> = ({
  status,
  progress,
  message,
  error,
}) => {
  if (status === 'idle') return null;

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-all ${
        status === 'completed'
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : status === 'failed'
          ? 'bg-rose-500/10 border-rose-500/30'
          : 'bg-indigo-500/10 border-indigo-500/30'
      }`}
    >
      <div className="flex items-center gap-3">
        {status === 'rendering' && (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
        )}
        {status === 'completed' && (
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        )}
        {status === 'failed' && (
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
        )}

        <div className="flex-grow min-w-0">
          <p className={`text-sm font-semibold ${
            status === 'completed'
              ? 'text-emerald-300'
              : status === 'failed'
              ? 'text-rose-300'
              : 'text-indigo-300'
          }`}>
            {status === 'rendering' && 'Rendering video with FFmpeg...'}
            {status === 'completed' && 'Video rendered successfully!'}
            {status === 'failed' && 'Rendering failed'}
          </p>
          {message && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{message}</p>
          )}
          {error && status === 'failed' && (
            <p className="text-xs text-rose-400 mt-0.5">{error}</p>
          )}
        </div>

        {status === 'rendering' && (
          <span className="text-sm font-mono font-bold text-indigo-300 flex-shrink-0">
            {progress}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {status === 'rendering' && (
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
};
