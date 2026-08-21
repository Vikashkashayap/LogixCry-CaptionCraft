'use client';

import React, { useRef, useCallback } from 'react';
import { EditorState } from '../../types/editor';
import { Film, Type, Music, Sparkles, Scissors, Eye, Zap } from 'lucide-react';

interface TimelineProps {
  editorState: EditorState;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onSelectTrackItem?: (track: 'video' | 'caption' | 'audio' | 'effect', id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  editorState,
  currentTime,
  duration,
  onSeek,
  onSelectTrackItem,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const totalDuration = duration > 0 ? duration : 60;

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const seekTime = (clickX / rect.width) * totalDuration;
      onSeek(seekTime);
    },
    [totalDuration, onSeek]
  );

  const formatTimeShort = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Generate ruler ticks (e.g. 5s or 10s intervals)
  const tickInterval = totalDuration > 120 ? 10 : totalDuration > 30 ? 5 : 2;
  const tickCount = Math.ceil(totalDuration / tickInterval);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval).filter(
    (t) => t <= totalDuration
  );

  const playheadPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  return (
    <div className="flex flex-col bg-[#0b101d] border-t border-slate-800 select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1424] border-b border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Timeline</span>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            Multi-Track
          </span>
        </div>
        <div className="font-mono text-slate-300">
          <span className="text-indigo-400">{formatTimeShort(currentTime)}</span> / {formatTimeShort(totalDuration)}
        </div>
      </div>

      <div className="flex">
        {/* Left Track Headers */}
        <div className="w-24 sm:w-28 flex-shrink-0 bg-[#0d1322] border-r border-slate-800 flex flex-col text-[11px] font-medium text-slate-400 divide-y divide-slate-800/60">
          {/* Ruler spacer */}
          <div className="h-6 flex items-center px-2 text-[10px] text-slate-500 font-mono">
            Time
          </div>
          {/* Track 1: Video */}
          <div className="h-9 flex items-center gap-1.5 px-2 text-sky-400">
            <Film className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Video</span>
          </div>
          {/* Track 2: Captions */}
          <div className="h-9 flex items-center gap-1.5 px-2 text-indigo-400">
            <Type className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Captions</span>
          </div>
          {/* Track 3: Audio */}
          <div className="h-9 flex items-center gap-1.5 px-2 text-emerald-400">
            <Music className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Audio</span>
          </div>
          {/* Track 4: Effects */}
          <div className="h-9 flex items-center gap-1.5 px-2 text-amber-400">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Effects</span>
          </div>
        </div>

        {/* Right Tracks Area with Playhead */}
        <div
          ref={rulerRef}
          onClick={handleTimelineClick}
          className="relative flex-grow h-[174px] bg-[#080c16] overflow-x-hidden cursor-pointer"
        >
          {/* Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none transition-all duration-75"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-rose-500 rotate-45 rounded-sm shadow-md" />
          </div>

          {/* Time Ruler */}
          <div className="h-6 border-b border-slate-800/80 relative flex items-center text-[9px] font-mono text-slate-500">
            {ticks.map((t) => {
              const leftPercent = (t / totalDuration) * 100;
              return (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 flex flex-col justify-end"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="-translate-x-1/2 mb-1">{formatTimeShort(t)}</span>
                  <div className="w-px h-1.5 bg-slate-700" />
                </div>
              );
            })}
          </div>

          {/* Track 1: VIDEO (Scenes & Cuts) */}
          <div className="h-9 border-b border-slate-800/50 relative py-1 px-0.5 bg-sky-950/10">
            {/* Full source video bar */}
            <div className="absolute inset-x-0 inset-y-1 bg-sky-900/30 rounded border border-sky-600/30 flex items-center px-2">
              <span className="text-[10px] text-sky-300 truncate">Source Video</span>
            </div>

            {/* Cut Segments Overlays */}
            {editorState.cuts.map((cut) => {
              const left = (cut.start / totalDuration) * 100;
              const width = Math.max(1, ((cut.end - cut.start) / totalDuration) * 100);
              return (
                <div
                  key={cut.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(cut.start);
                    onSelectTrackItem?.('video', cut.id);
                  }}
                  title={`Cut: ${cut.reason} (${cut.start.toFixed(1)}s - ${cut.end.toFixed(1)}s)`}
                  className={`absolute top-1 bottom-1 rounded border z-10 flex items-center justify-center text-[9px] font-bold ${
                    cut.accepted
                      ? 'bg-rose-600/60 border-rose-500 text-rose-100 line-through opacity-85'
                      : 'bg-rose-950/40 border-rose-700/50 text-rose-400 hover:bg-rose-900/50'
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <Scissors className="w-2.5 h-2.5 mr-0.5" />
                  <span className="hidden sm:inline truncate px-0.5">Cut</span>
                </div>
              );
            })}

            {/* Silence Segments Overlays */}
            {editorState.silenceSegments.map((sil) => {
              const left = (sil.start / totalDuration) * 100;
              const width = Math.max(1, (sil.duration / totalDuration) * 100);
              return (
                <div
                  key={sil.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(sil.start);
                    onSelectTrackItem?.('video', sil.id);
                  }}
                  title={`Silence: ${sil.duration}s (${sil.start.toFixed(1)}s - ${sil.end.toFixed(1)}s)`}
                  className={`absolute top-1 bottom-1 rounded border z-10 flex items-center justify-center text-[9px] ${
                    sil.accepted
                      ? 'bg-slate-700/80 border-slate-600 text-slate-300 line-through'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:bg-slate-700/50'
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <span className="truncate px-0.5">{sil.duration}s</span>
                </div>
              );
            })}
          </div>

          {/* Track 2: CAPTIONS */}
          <div className="h-9 border-b border-slate-800/50 relative py-1 px-0.5 bg-indigo-950/10">
            {editorState.captions.map((cap) => {
              const left = (cap.start / totalDuration) * 100;
              const width = Math.max(0.5, ((cap.end - cap.start) / totalDuration) * 100);
              const isActive = currentTime >= cap.start && currentTime <= cap.end;

              return (
                <div
                  key={cap.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(cap.start);
                    onSelectTrackItem?.('caption', cap.id);
                  }}
                  title={`${cap.start.toFixed(1)}s - ${cap.end.toFixed(1)}s: ${cap.text}`}
                  className={`absolute top-1 bottom-1 rounded px-1 flex items-center text-[9px] font-medium truncate cursor-pointer transition-colors border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                      : 'bg-indigo-950/60 text-indigo-200 border-indigo-700/40 hover:bg-indigo-900/60'
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <span className="truncate">{cap.text || '...'}</span>
                </div>
              );
            })}
          </div>

          {/* Track 3: AUDIO (Voice & Music) */}
          <div className="h-9 border-b border-slate-800/50 relative py-1 px-0.5 bg-emerald-950/10 flex flex-col justify-center">
            {/* Base Voice Track */}
            <div className="h-3 bg-emerald-950/40 border border-emerald-800/30 rounded flex items-center px-1">
              <span className="text-[8px] text-emerald-400 truncate">
                Voice Audio {editorState.music?.muteOriginalAudio ? '(Muted)' : ''}
              </span>
            </div>

            {/* Music Track overlay if configured */}
            {editorState.music && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTrackItem?.('audio', 'music');
                }}
                className="mt-0.5 h-3 bg-teal-600/40 border border-teal-400/50 rounded flex items-center px-1 text-[8px] text-teal-200 truncate cursor-pointer hover:bg-teal-600/60"
              >
                <Music className="w-2 h-2 mr-1" />
                <span className="truncate">
                  {editorState.music.trackName || 'Background Music'} ({Math.round(editorState.music.volume * 100)}%)
                </span>
              </div>
            )}
          </div>

          {/* Track 4: EFFECTS (Zooms, Transitions, Highlights) */}
          <div className="h-9 relative py-1 px-0.5 bg-amber-950/10">
            {/* Highlights */}
            {editorState.highlights.map((h) => {
              const left = (h.start / totalDuration) * 100;
              const width = Math.max(1, ((h.end - h.start) / totalDuration) * 100);
              return (
                <div
                  key={h.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(h.start);
                    onSelectTrackItem?.('effect', h.id);
                  }}
                  title={`Highlight: ${h.reason} (Score: ${h.score})`}
                  className="absolute top-1 bottom-1 bg-amber-500/30 border border-amber-400/60 rounded px-1 flex items-center text-[8px] font-bold text-amber-200 cursor-pointer hover:bg-amber-500/50"
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <Zap className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
                  <span className="truncate hidden sm:inline">{h.reason}</span>
                </div>
              );
            })}

            {/* Zooms */}
            {editorState.zooms.map((z) => {
              const left = (z.start / totalDuration) * 100;
              const width = Math.max(1, ((z.end - z.start) / totalDuration) * 100);
              return (
                <div
                  key={z.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(z.start);
                    onSelectTrackItem?.('effect', z.id);
                  }}
                  title={`Zoom ${z.scale}x: ${z.reason || ''}`}
                  className="absolute top-1 bottom-1 bg-purple-500/40 border border-purple-400/70 rounded px-1 flex items-center text-[8px] font-bold text-purple-200 cursor-pointer hover:bg-purple-500/60"
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <Eye className="w-2.5 h-2.5 mr-0.5" />
                  <span>{z.scale}x</span>
                </div>
              );
            })}

            {/* Transitions */}
            {editorState.transitions.map((tr) => {
              const left = (tr.time / totalDuration) * 100;
              return (
                <div
                  key={tr.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(tr.time);
                    onSelectTrackItem?.('effect', tr.id);
                  }}
                  title={`Transition: ${tr.type} (${tr.duration}s)`}
                  className="absolute top-1 bottom-1 w-2 -ml-1 bg-cyan-400 border border-cyan-200 rounded-sm z-20 cursor-pointer"
                  style={{ left: `${left}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
