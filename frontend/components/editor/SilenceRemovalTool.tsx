'use client';

import React, { useState } from 'react';
import { SilenceSegment } from '../../types/editor';
import { detectSilenceApi } from '../../lib/api';
import { VolumeX, Play, Trash2, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface SilenceRemovalToolProps {
  jobId: string;
  silenceSegments: SilenceSegment[];
  onSilenceDetected: (segments: SilenceSegment[]) => void;
  onToggleSilence: (id: string) => void;
  onAcceptAllSilence: () => void;
  onSeek: (time: number) => void;
}

export const SilenceRemovalTool: React.FC<SilenceRemovalToolProps> = ({
  jobId,
  silenceSegments,
  onSilenceDetected,
  onToggleSilence,
  onAcceptAllSilence,
  onSeek,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [minDuration, setMinDuration] = useState(0.6);
  const [keepPadding, setKeepPadding] = useState(0.15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetectSilence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await detectSilenceApi(jobId, minDuration, '-30dB', keepPadding);
      if (res && res.silenceSegments) {
        onSilenceDetected(res.silenceSegments);
      }
    } catch (err: any) {
      console.error('[Silence Detection Error]:', err);
      setError(err.message || 'Failed to detect audio silence.');
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
  };

  const acceptedCount = silenceSegments.filter((s) => s.accepted).length;

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <VolumeX className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Auto Remove Silence</h3>
              <p className="text-[10px] text-slate-400">FFmpeg Audio Spectrum Analysis</p>
            </div>
          </div>

          <button
            onClick={() => setEnabled(!enabled)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
              enabled
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {enabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-2 pt-1">
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Silence longer than:</span>
              <span className="font-mono text-white">{minDuration.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={2.0}
              step={0.05}
              value={minDuration}
              onChange={(e) => setMinDuration(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Keep pause padding:</span>
              <span className="font-mono text-white">{keepPadding.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.4}
              step={0.05}
              value={keepPadding}
              onChange={(e) => setKeepPadding(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Detect Button */}
        <button
          onClick={handleDetectSilence}
          disabled={loading || !enabled}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Scanning Audio Spectrum...
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              Detect Silence
            </>
          )}
        </button>

        {error && (
          <div className="p-2 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Detected Segments List */}
      {silenceSegments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Detected Silence ({silenceSegments.length})
            </span>
            <button
              onClick={onAcceptAllSilence}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Remove All
            </button>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {silenceSegments.map((seg) => (
              <div
                key={seg.id}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                  seg.accepted
                    ? 'bg-emerald-950/30 border-emerald-600/50'
                    : 'bg-[#0d1220] border-slate-800'
                }`}
              >
                <div>
                  <p className="font-mono text-[10px] text-slate-400">
                    {formatSeconds(seg.start)} → {formatSeconds(seg.end)}
                  </p>
                  <p className="text-[11px] text-slate-200">{seg.duration.toFixed(1)}s pause</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSeek(seg.start)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                    title="Seek & Preview"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onToggleSilence(seg.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      seg.accepted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {seg.accepted ? 'Removed' : 'Keep'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
