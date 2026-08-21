'use client';

import React, { useState } from 'react';
import { Undo2, Redo2, RotateCcw, Clapperboard, AlertTriangle } from 'lucide-react';
import { Caption } from '../../types/editor';
import { validateCaptions } from '../../lib/captionUtils';

interface EditorToolbarProps {
  captions: Caption[];
  videoDuration: number;
  canUndo: boolean;
  canRedo: boolean;
  isRendering: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetStyle: () => void;
  onResetCaptions: () => void;
  onRender: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  captions,
  videoDuration,
  canUndo,
  canRedo,
  isRendering,
  onUndo,
  onRedo,
  onResetStyle,
  onResetCaptions,
  onRender,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const handleRenderClick = () => {
    const result = validateCaptions(captions, videoDuration > 0 ? videoDuration : undefined);
    if (!result.valid) {
      setValidationErrors(result.errors.map((e) => e.message));
      setShowErrors(true);
      return;
    }
    setValidationErrors([]);
    setShowErrors(false);
    onRender();
  };

  const handleResetCaptions = () => {
    if (showResetConfirm) {
      onResetCaptions();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  return (
    <div className="space-y-2">
      {/* Main toolbar row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: undo/redo + reset */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-slate-700"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-slate-700"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={onResetStyle}
            title="Reset style to defaults"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs border border-transparent hover:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Style
          </button>

          <button
            type="button"
            onClick={handleResetCaptions}
            title={showResetConfirm ? 'Click again to confirm reset' : 'Reset captions to original'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-xs border ${
              showResetConfirm
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent hover:border-slate-700'
            }`}
          >
            {showResetConfirm && <AlertTriangle className="w-3.5 h-3.5" />}
            {showResetConfirm ? 'Confirm Reset?' : 'Reset Captions'}
          </button>
        </div>

        {/* Right: Render CTA */}
        <button
          type="button"
          onClick={handleRenderClick}
          disabled={isRendering}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xl ${
            isRendering
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 hover:scale-[1.02] cursor-pointer'
          }`}
        >
          <Clapperboard className="w-4 h-4" />
          {isRendering ? 'Rendering...' : 'Render Video'}
        </button>
      </div>

      {/* Validation errors */}
      {showErrors && validationErrors.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Caption validation failed
            </p>
            <button
              type="button"
              onClick={() => setShowErrors(false)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-0.5">
            {validationErrors.slice(0, 5).map((msg, i) => (
              <li key={i} className="text-xs text-rose-400">
                • {msg}
              </li>
            ))}
            {validationErrors.length > 5 && (
              <li className="text-xs text-rose-500">
                ...and {validationErrors.length - 5} more issue(s)
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
