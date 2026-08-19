import React, { useState } from 'react';
import { JobHistoryItem } from '../types';
import { Clock, Play, Download, Trash2, FileVideo, Sparkles, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { deleteJobApi, getDownloadUrl } from '../lib/api';

interface HistorySectionProps {
  history: JobHistoryItem[];
  onSelectJob: (jobId: string) => void;
  onRefresh: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history, onSelectJob, onRefresh }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!history || history.length === 0) {
    return null;
  }

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeletingId(jobId);
      await deleteJobApi(jobId);
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-slate-800/80 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Your Captioned Videos History</h3>
            <p className="text-xs text-slate-400">Stored and persisted securely in MongoDB Atlas</p>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-mono self-start sm:self-auto bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          {history.length} video{history.length === 1 ? '' : 's'} recorded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => {
          const isCompleted = item.status === 'completed';
          const isDeleting = deletingId === item.jobId;
          const isConfirming = confirmDeleteId === item.jobId;

          return (
            <div
              key={item.jobId}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 transition-all space-y-3.5 flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Header with filename & status badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
                      <FileVideo className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate" title={item.originalName}>
                        {item.originalName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Details chips */}
                <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatDuration(item.duration)}</span>
                  </div>
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 capitalize text-slate-300">
                    {item.style}
                  </span>
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                    {item.language}
                  </span>
                  {item.captionsCount > 0 && (
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-indigo-300">
                      {item.captionsCount} captions
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80">
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={(e) => handleDelete(item.jobId, e)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectJob(item.jobId)}
                      className="flex-1 py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-500/30 hover:border-indigo-500/60"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Preview & Edit</span>
                    </button>

                    {isCompleted && (
                      <a
                        href={getDownloadUrl(item.jobId, 'mp4')}
                        download
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
                        title="Download MP4"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(item.jobId);
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors border border-slate-700/50"
                      title="Delete video & captions from database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
