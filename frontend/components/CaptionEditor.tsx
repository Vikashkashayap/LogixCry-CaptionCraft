import React, { useState } from 'react';
import { CaptionItem, CaptionStyle } from '../types';
import { Edit3, RefreshCw, Save, Clock, Plus, Trash2, Palette, Sparkles } from 'lucide-react';

interface CaptionEditorProps {
  initialCaptions: CaptionItem[];
  jobId: string;
  currentStyle: CaptionStyle;
  onRerenderRequested: (captions: CaptionItem[], newStyle?: CaptionStyle) => void;
  isReRendering?: boolean;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  initialCaptions,
  currentStyle,
  onRerenderRequested,
  isReRendering,
}) => {
  const [captions, setCaptions] = useState<CaptionItem[]>(initialCaptions);
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle>(currentStyle);

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...captions];
    updated[index].text = newText;
    setCaptions(updated);
  };

  const handleStartChange = (index: number, newStart: number) => {
    const updated = [...captions];
    updated[index].start = Math.max(0, newStart);
    setCaptions(updated);
  };

  const handleEndChange = (index: number, newEnd: number) => {
    const updated = [...captions];
    updated[index].end = Math.max(updated[index].start + 0.1, newEnd);
    setCaptions(updated);
  };

  const handleAddCaption = () => {
    const last = captions[captions.length - 1];
    const newStart = last ? Number((last.end + 0.2).toFixed(2)) : 0.0;
    const newEnd = Number((newStart + 2.5).toFixed(2));
    setCaptions([...captions, { start: newStart, end: newEnd, text: 'New subtitle text' }]);
  };

  const handleDeleteCaption = (index: number) => {
    const updated = captions.filter((_, i) => i !== index);
    setCaptions(updated);
  };

  const handleSaveAndReRender = () => {
    onRerenderRequested(captions, selectedStyle);
  };

  const styleOptions: { id: CaptionStyle; label: string }[] = [
    { id: 'bold', label: '🔥 Bold Social' },
    { id: 'classic', label: '🎬 Classic Cinema' },
    { id: 'highlight', label: '⚡ Electric Cyan' },
    { id: 'cyber', label: '💖 Cyber Magenta' },
    { id: 'reels', label: '🌿 Reels Lime' },
    { id: 'minimal', label: '🧊 Minimal Clean' },
  ];

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-slate-800 space-y-5 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            Interactive Caption & Style Editor
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Change wording, fine-tune timing timestamps, or switch visual styles — then re-burn in ~2 seconds without calling AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Style Switcher in Editor */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Palette className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-slate-400">Style:</span>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as CaptionStyle)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {styleOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddCaption}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line
          </button>

          <button
            type="button"
            onClick={handleSaveAndReRender}
            disabled={isReRendering}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {isReRendering ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Re-burning Video with FFmpeg...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Re-render Video with Edits
              </>
            )}
          </button>
        </div>
      </div>

      {/* Caption Items List */}
      <div className="max-h-[420px] overflow-y-auto pr-1.5 space-y-2.5">
        {captions.map((cap, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-3 group"
          >
            <span className="text-xs font-mono font-semibold text-slate-500 w-5 flex-shrink-0">
              #{idx + 1}
            </span>

            {/* Timestamp scrubber inputs */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="number"
                step="0.1"
                value={cap.start}
                onChange={(e) => handleStartChange(idx, parseFloat(e.target.value) || 0)}
                className="w-14 bg-transparent text-center text-slate-200 focus:outline-none focus:text-indigo-400 font-semibold"
                title="Start time (seconds)"
              />
              <span className="text-slate-600">-</span>
              <input
                type="number"
                step="0.1"
                value={cap.end}
                onChange={(e) => handleEndChange(idx, parseFloat(e.target.value) || 0)}
                className="w-14 bg-transparent text-center text-slate-200 focus:outline-none focus:text-indigo-400 font-semibold"
                title="End time (seconds)"
              />
              <span className="text-[10px] text-slate-500 font-sans">sec</span>
            </div>

            {/* Text input */}
            <input
              type="text"
              value={cap.text}
              onChange={(e) => handleTextChange(idx, e.target.value)}
              placeholder="Spoken subtitle text..."
              className="flex-grow w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/80 transition-colors"
            />

            {/* Delete button */}
            <button
              type="button"
              onClick={() => handleDeleteCaption(idx)}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100 flex-shrink-0"
              title="Delete line"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
