'use client';

import React, { useRef, useState } from 'react';
import { Caption } from '../../types/editor';
import { getActiveCaptionIndex } from '../../lib/captionUtils';
import { CaptionRow } from './CaptionRow';
import { Plus, List, Palette } from 'lucide-react';

interface CaptionListProps {
  captions: Caption[];
  currentTime: number;
  videoDuration: number;
  canUndo: boolean;
  canRedo: boolean;
  onUpdate: (id: string, updates: Partial<Omit<Caption, 'id'>>) => void;
  onDelete: (id: string) => void;
  onAdd: (atTime?: number) => Caption;
  onSeek: (time: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenStyles?: () => void;
}

export const CaptionList: React.FC<CaptionListProps> = ({
  captions,
  currentTime,
  videoDuration,
  canUndo,
  canRedo,
  onUpdate,
  onDelete,
  onAdd,
  onSeek,
  onUndo,
  onRedo,
  onOpenStyles,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [newCaptionId, setNewCaptionId] = useState<string | null>(null);
  const activeIdx = getActiveCaptionIndex(captions, currentTime);

  const handleAdd = () => {
    const caption = onAdd(currentTime);
    setNewCaptionId(caption.id);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    if (newCaptionId === id) setNewCaptionId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-slate-800/70 bg-[#0d1323]">
        <div className="flex items-center gap-1.5">
          <List className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Captions</span>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full tabular-nums">
            {captions.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenStyles && (
            <button
              onClick={onOpenStyles}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-semibold transition-all"
              title="Customize caption styles & colors"
            >
              <Palette className="w-3 h-3" />
              Styles
            </button>
          )}

          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      {/* Scrollable caption list */}
      <div
        ref={listRef}
        className="flex-grow overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}
      >
        {captions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-4">
              <List className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No captions yet</p>
            <p className="text-xs text-slate-600 mt-1">Click <span className="text-indigo-400 font-semibold">+ Add</span> to create one</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {captions.map((cap, idx) => (
              <CaptionRow
                key={cap.id}
                caption={cap}
                index={idx}
                isActive={idx === activeIdx}
                videoDuration={videoDuration}
                onUpdate={onUpdate}
                onDelete={handleDelete}
                onSeek={onSeek}
                autoFocus={cap.id === newCaptionId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 px-4 py-2.5 border-t border-slate-800/60 bg-[#0d1323]">
        <p className="text-[10px] text-slate-600 text-center">
          Click ⏱ to seek · Ctrl+Z to undo · Times in MM:SS.cc
        </p>
      </div>
    </div>
  );
};
