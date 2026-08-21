'use client';

import React, { useState } from 'react';
import { ZoomEffect, TransitionEffect, TransitionType } from '../../types/editor';
import { Sparkles, Eye, Plus, Trash2, Gauge, GitCommit, Play } from 'lucide-react';

interface EffectsPanelProps {
  currentTime: number;
  duration: number;
  zooms: ZoomEffect[];
  transitions: TransitionEffect[];
  globalSpeed: number;
  onAddZoom: (start: number, end: number, scale?: number, reason?: string) => void;
  onUpdateZoom: (id: string, updates: Partial<ZoomEffect>) => void;
  onDeleteZoom: (id: string) => void;
  onAddTransition: (time: number, type?: TransitionType, duration?: number) => void;
  onDeleteTransition: (id: string) => void;
  onSetGlobalSpeed: (speed: number) => void;
  onSeek: (time: number) => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  currentTime,
  duration,
  zooms,
  transitions,
  globalSpeed,
  onAddZoom,
  onUpdateZoom,
  onDeleteZoom,
  onAddTransition,
  onDeleteTransition,
  onSetGlobalSpeed,
  onSeek,
}) => {
  const [zoomScale, setZoomScale] = useState(1.15);
  const [transitionType, setTransitionType] = useState<TransitionType>('crossfade');

  const handleCreateZoom = () => {
    const start = Math.max(0, Math.min(duration, currentTime));
    const end = Math.min(duration, start + 2.5);
    onAddZoom(start, end, zoomScale, 'Manual zoom');
  };

  const handleCreateTransition = () => {
    const time = Math.max(0, Math.min(duration, currentTime));
    onAddTransition(time, transitionType, 0.3);
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="space-y-5">
      {/* ── VIDEO SPEED SECTION ────────────────────────────────────────── */}
      <section className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Playback Speed</h3>
            <p className="text-[10px] text-slate-400">Audio-Pitch Preserved Video Speed</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 pt-1">
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => onSetGlobalSpeed(s)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                globalSpeed === s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#0d1220] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </section>

      {/* ── MANUAL ZOOM SECTION ────────────────────────────────────────── */}
      <section className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Manual Zoom</h3>
              <p className="text-[10px] text-slate-400">Dynamic Camera Punch-In</p>
            </div>
          </div>

          <button
            onClick={handleCreateZoom}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Zoom</span>
          </button>
        </div>

        {/* Zoom Intensity Picker */}
        <div>
          <span className="text-[10px] text-slate-400 block mb-1">Zoom Intensity:</span>
          <div className="grid grid-cols-5 gap-1">
            {[1.05, 1.10, 1.15, 1.20, 1.25].map((scale) => (
              <button
                key={scale}
                onClick={() => setZoomScale(scale)}
                className={`py-1 rounded text-[11px] font-semibold transition-all ${
                  zoomScale === scale
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>
        </div>

        {/* Existing Zooms List */}
        {zooms.length > 0 && (
          <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
            {zooms.map((z) => (
              <div
                key={z.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0d1220] border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSeek(z.start)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Play className="w-2.5 h-2.5" />
                  </button>
                  <span className="font-mono text-[10px] text-slate-300">
                    {z.start.toFixed(1)}s → {z.end.toFixed(1)}s ({z.scale}x)
                  </span>
                </div>

                <button
                  onClick={() => onDeleteZoom(z.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── TRANSITIONS SECTION ────────────────────────────────────────── */}
      <section className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Transitions</h3>
              <p className="text-[10px] text-slate-400">Scene Cut &amp; Fade Effects</p>
            </div>
          </div>

          <button
            onClick={handleCreateTransition}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transition</span>
          </button>
        </div>

        {/* Transition Type Selector */}
        <div className="grid grid-cols-3 gap-1">
          {(['cut', 'fade', 'crossfade'] as TransitionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setTransitionType(type)}
              className={`py-1.5 capitalize rounded-lg text-xs font-semibold transition-all ${
                transitionType === type
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                  : 'bg-[#0d1220] border border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Existing Transitions List */}
        {transitions.length > 0 && (
          <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
            {transitions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0d1220] border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSeek(t.time)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Play className="w-2.5 h-2.5" />
                  </button>
                  <span className="font-mono text-[10px] text-slate-300">
                    {t.time.toFixed(1)}s — <span className="capitalize text-cyan-300">{t.type}</span> ({t.duration}s)
                  </span>
                </div>

                <button
                  onClick={() => onDeleteTransition(t.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
