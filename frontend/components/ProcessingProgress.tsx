import React from 'react';
import { JobStatus } from '../types';
import { Loader2, Sparkles, Film, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ProcessingProgressProps {
  status: JobStatus;
  progress: number;
  message: string;
  error?: string | null;
  onRetry?: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  status,
  progress,
  message,
  error,
  onRetry,
}) => {
  const steps: { id: JobStatus; label: string; icon: React.ReactNode }[] = [
    { id: 'uploading', label: 'Upload Video', icon: <Film className="w-4 h-4" /> },
    { id: 'sending_to_ai', label: 'Send to AI', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'analyzing', label: 'Analyze Speech', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    { id: 'generating_captions', label: 'Gen Captions', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'rendering', label: 'Burn FFmpeg MP4', icon: <Film className="w-4 h-4" /> },
  ];

  const getStepState = (stepId: JobStatus) => {
    const order: JobStatus[] = ['uploading', 'sending_to_ai', 'analyzing', 'generating_captions', 'rendering', 'completed'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepId);

    if (status === 'failed') return 'error';
    if (currentIndex > stepIndex || status === 'completed') return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-indigo-500/20 bg-slate-900/80 max-w-3xl mx-auto shadow-2xl shadow-indigo-950/50">
      {status === 'failed' ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Video Processing Failed</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">{error || 'An unexpected error occurred.'}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Generating Captions...</h3>
                <p className="text-xs text-slate-400 mt-0.5">{message || 'Processing video file...'}</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-indigo-400 font-mono">{progress}%</span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm shadow-indigo-500"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>

          {/* Stages Pipeline Steps */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {steps.map((step) => {
              const state = getStepState(step.id);
              return (
                <div key={step.id} className="flex flex-col items-center text-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                      state === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : state === 'current'
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40 ring-4 ring-indigo-500/20 animate-pulse'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                    }`}
                  >
                    {state === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:block ${
                      state === 'completed'
                        ? 'text-emerald-400'
                        : state === 'current'
                        ? 'text-indigo-300 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
