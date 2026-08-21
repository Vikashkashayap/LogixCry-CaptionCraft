'use client';

import React from 'react';
import { CaptionStyleKey } from '../../types/editor';
import { CAPTION_STYLES } from '../../lib/editorStyles';
import { Check } from 'lucide-react';

interface CaptionStyleSelectorProps {
  value: CaptionStyleKey;
  onChange: (style: CaptionStyleKey) => void;
}

export const CaptionStyleSelector: React.FC<CaptionStyleSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CAPTION_STYLES.map((style) => {
        const sel = value === style.key;
        return (
          <button
            key={style.key}
            type="button"
            onClick={() => onChange(style.key)}
            className={`relative flex flex-col gap-1.5 p-2.5 rounded-xl border text-left transition-all ${
              sel
                ? 'border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/5'
                : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/50'
            }`}
          >
            {/* Mini preview */}
            <div className="w-full h-8 rounded-lg bg-black/60 border border-slate-800 flex items-center justify-center overflow-hidden">
              <span
                className="text-[10px] font-bold leading-none"
                style={{
                  color: style.previewTextColor,
                  fontFamily: style.previewFontFamily,
                  fontWeight: style.previewFontWeight,
                  textShadow: style.previewTextShadow,
                  letterSpacing: style.previewLetterSpacing,
                  textTransform: style.previewTextTransform as React.CSSProperties['textTransform'],
                }}
              >
                {style.emoji} CAPTION
              </span>
            </div>

            {/* Label row */}
            <div className="flex items-center justify-between">
              <p className={`text-[11px] font-semibold leading-none ${sel ? 'text-white' : 'text-slate-300'}`}>
                {style.label}
              </p>
              {sel ? (
                <div className="w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2 h-2 text-white stroke-[3]" />
                </div>
              ) : (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${style.tagClassName}`}>
                  {style.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
