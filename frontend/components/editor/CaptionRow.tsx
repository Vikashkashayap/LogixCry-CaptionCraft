'use client';

import React, { useRef, useEffect } from 'react';
import { Caption } from '../../types/editor';
import { secondsToTime, timeToSeconds } from '../../lib/captionUtils';
import { Trash2, Clock } from 'lucide-react';

interface CaptionRowProps {
  caption: Caption;
  index: number;
  isActive: boolean;
  videoDuration: number;
  onUpdate: (id: string, updates: Partial<Omit<Caption, 'id'>>) => void;
  onDelete: (id: string) => void;
  onSeek: (time: number) => void;
  autoFocus?: boolean;
}

export const CaptionRow: React.FC<CaptionRowProps> = ({
  caption,
  index,
  isActive,
  videoDuration,
  onUpdate,
  onDelete,
  onSeek,
  autoFocus,
}) => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [autoFocus]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(caption.id, { text: e.target.value });
  };

  const handleStartBlur = () => {
    if (!startRef.current) return;
    const val = timeToSeconds(startRef.current.value);
    if (isNaN(val)) { startRef.current.value = secondsToTime(caption.start); return; }
    const clamped = Math.max(0, val);
    const newEnd = caption.end <= clamped ? clamped + 2 : caption.end;
    onUpdate(caption.id, { start: clamped, end: newEnd });
  };

  const handleEndBlur = () => {
    if (!endRef.current) return;
    const val = timeToSeconds(endRef.current.value);
    if (isNaN(val)) { endRef.current.value = secondsToTime(caption.end); return; }
    const max = videoDuration > 0 ? videoDuration : 9999;
    const clamped = Math.min(max, Math.max(caption.start + 0.1, val));
    onUpdate(caption.id, { end: clamped });
  };

  const handleTimingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  };

  const dur = (caption.end - caption.start).toFixed(1);

  return (
    <div
      className={`group relative px-3 py-3 transition-all ${
        isActive
          ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
          : 'border-l-2 border-transparent hover:bg-slate-800/30 hover:border-l-slate-700'
      }`}
    >
      {/* Row header: index + timing + delete */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Caption number */}
          <span className={`text-[10px] font-mono font-bold tabular-nums w-5 text-center flex-shrink-0 ${
            isActive ? 'text-indigo-400' : 'text-slate-600'
          }`}>
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Timing pill */}
          <button
            onClick={() => onSeek(caption.start)}
            title="Seek to caption"
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono transition-colors cursor-pointer ${
              isActive
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <input
              ref={startRef}
              type="text"
              defaultValue={secondsToTime(caption.start)}
              key={`s-${caption.start}`}
              onBlur={handleStartBlur}
              onKeyDown={handleTimingKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-14 bg-transparent focus:outline-none text-center"
              title="Start time (MM:SS.cc)"
            />
            <span className="text-slate-600 mx-0.5">→</span>
            <input
              ref={endRef}
              type="text"
              defaultValue={secondsToTime(caption.end)}
              key={`e-${caption.end}`}
              onBlur={handleEndBlur}
              onKeyDown={handleTimingKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-14 bg-transparent focus:outline-none text-center"
              title="End time (MM:SS.cc)"
            />
          </button>

          <span className="text-[10px] text-slate-600 font-mono">{dur}s</span>

          {isActive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              LIVE
            </span>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(caption.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          title="Delete caption"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Text area */}
      <textarea
        ref={textRef}
        value={caption.text}
        onChange={handleTextChange}
        placeholder="Caption text..."
        rows={2}
        className={`w-full bg-slate-900/70 border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none transition-colors leading-snug ${
          isActive
            ? 'border-indigo-500/40 focus:border-indigo-400 bg-indigo-500/5'
            : 'border-slate-700/60 focus:border-slate-600'
        }`}
      />
    </div>
  );
};
