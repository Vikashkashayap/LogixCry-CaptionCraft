'use client';

import { AspectRatioKey } from '../../types/editor';
import { ASPECT_RATIO_LIST } from '../../lib/aspectRatioConfig';

interface AspectRatioSelectorProps {
  value: AspectRatioKey;
  onChange: (ratio: AspectRatioKey) => void;
}

const SHAPES: Record<AspectRatioKey, { w: number; h: number }> = {
  '16:9': { w: 48, h: 28 },
  '9:16': { w: 20, h: 36 },
  '1:1':  { w: 32, h: 32 },
  '4:5':  { w: 28, h: 35 },
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {ASPECT_RATIO_LIST.map((r) => {
        const sel = value === r.id;
        const shape = SHAPES[r.id] || { w: 32, h: 32 };
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={`flex flex-col items-center gap-2.5 py-3 px-2 rounded-xl border transition-all ${
              sel
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                : 'border-slate-700/60 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
            }`}
          >
            {/* Visual ratio shape */}
            <div className="h-11 flex items-center justify-center">
              <div
                className={`rounded-sm transition-colors ${
                  sel ? 'bg-indigo-500/30 border border-indigo-400/50' : 'bg-slate-700/60 border border-slate-600/50'
                }`}
                style={{ width: shape.w, height: shape.h }}
              />
            </div>
            <div className="text-center">
              <p className={`text-xs font-bold leading-none ${sel ? 'text-indigo-300' : 'text-slate-300'}`}>
                {r.label}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{r.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
