'use client';

import React from 'react';
import { EditorState, SAFE_FONTS, PositionKey } from '../../types/editor';
import { UseVideoEditorReturn } from '../../hooks/useVideoEditor';
import { AlignLeft, AlignCenter, AlignRight, RotateCcw } from 'lucide-react';

interface CaptionCustomizationProps {
  state: EditorState;
  actions: Pick<
    UseVideoEditorReturn,
    | 'setFontFamily' | 'setFontSize' | 'setTextColor'
    | 'setBackgroundEnabled' | 'setBackgroundColor' | 'setBackgroundOpacity'
    | 'setOutlineEnabled' | 'setOutlineColor' | 'setOutlineWidth'
    | 'setPosition' | 'setCaptionWidth' | 'setTextAlign' | 'resetStyle'
  >;
}

const POSITIONS: { key: PositionKey; icon: string }[] = [
  { key: 'top', icon: '⬆' },
  { key: 'center', icon: '⬛' },
  { key: 'bottom', icon: '⬇' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function Toggle({
  enabled,
  onToggle,
  label,
  color,
  onColorChange,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  color?: string;
  onColorChange?: (c: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div
        onClick={onToggle}
        className={`relative flex items-center w-8 h-4.5 rounded-full cursor-pointer transition-colors ${
          enabled ? 'bg-indigo-600' : 'bg-slate-700'
        }`}
        style={{ height: 18 }}
      >
        <div
          className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-xs text-slate-400 flex-grow ml-2">
        {enabled ? label : 'Disabled'}
      </span>
      {enabled && color && onColorChange && (
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer p-0.5 flex-shrink-0"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export const CaptionCustomization: React.FC<CaptionCustomizationProps> = ({ state, actions }) => {
  return (
    <div className="space-y-5">
      {/* Reset button */}
      <div className="flex justify-end">
        <button
          onClick={actions.resetStyle}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* ── FONT ────────────────────────────────────────────────────────── */}
      <Section>
        <Label>Font</Label>
        <select
          value={state.fontFamily}
          onChange={(e) => actions.setFontFamily(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700/70 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {SAFE_FONTS.map((f) => (
            <option key={f.value} value={f.value} className="bg-slate-900">
              {f.label}
            </option>
          ))}
        </select>
      </Section>

      {/* ── FONT SIZE ───────────────────────────────────────────────────── */}
      <Section>
        <Label>Font Size — {state.fontSize}px</Label>
        <div className="flex items-center gap-2">
          <input
            type="range" min={12} max={96} step={1} value={state.fontSize}
            onChange={(e) => actions.setFontSize(Number(e.target.value))}
            className="flex-grow h-1 rounded-full appearance-none bg-slate-700 cursor-pointer accent-indigo-500"
          />
          <input
            type="number" min={12} max={96} value={state.fontSize}
            onChange={(e) => actions.setFontSize(Number(e.target.value))}
            className="w-11 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-indigo-500"
          />
        </div>
      </Section>

      {/* ── TEXT COLOR ──────────────────────────────────────────────────── */}
      <Section>
        <Label>Text Color</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color" value={state.textColor}
              onChange={(e) => actions.setTextColor(e.target.value)}
              className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer p-0.5 flex-shrink-0"
            />
            <input
              type="text" value={state.textColor}
              onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) actions.setTextColor(e.target.value); }}
              className="flex-grow bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-indigo-500 uppercase"
              maxLength={7}
            />
          </div>

          {/* Quick Color Swatches */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {[
              { label: 'White', color: '#FFFFFF' },
              { label: 'Yellow', color: '#FFE600' },
              { label: 'Cyan', color: '#00FFFF' },
              { label: 'Lime', color: '#00FF66' },
              { label: 'Pink', color: '#FF1493' },
              { label: 'Orange', color: '#FF7700' },
              { label: 'Red', color: '#FF3333' },
              { label: 'Gold', color: '#FFD700' },
            ].map((swatch) => (
              <button
                key={swatch.color}
                type="button"
                onClick={() => actions.setTextColor(swatch.color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                  state.textColor.toUpperCase() === swatch.color.toUpperCase()
                    ? 'border-indigo-400 scale-110 ring-2 ring-indigo-500/50'
                    : 'border-slate-700 hover:border-slate-400'
                }`}
                style={{ backgroundColor: swatch.color }}
                title={swatch.label}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── BACKGROUND ──────────────────────────────────────────────────── */}
      <Section>
        <Label>Background</Label>
        <Toggle
          enabled={state.backgroundEnabled}
          onToggle={() => actions.setBackgroundEnabled(!state.backgroundEnabled)}
          label="Background Box"
          color={state.backgroundColor}
          onColorChange={actions.setBackgroundColor}
        />
        {state.backgroundEnabled && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-500 w-14">Opacity</span>
            <input
              type="range" min={0} max={100} step={5} value={state.backgroundOpacity}
              onChange={(e) => actions.setBackgroundOpacity(Number(e.target.value))}
              className="flex-grow h-1 rounded-full appearance-none bg-slate-700 cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] text-slate-400 w-7 text-right">{state.backgroundOpacity}%</span>
          </div>
        )}
      </Section>

      {/* ── OUTLINE ─────────────────────────────────────────────────────── */}
      <Section>
        <Label>Outline / Stroke</Label>
        <Toggle
          enabled={state.outlineEnabled}
          onToggle={() => actions.setOutlineEnabled(!state.outlineEnabled)}
          label="Outline"
          color={state.outlineColor}
          onColorChange={actions.setOutlineColor}
        />
        {state.outlineEnabled && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-500 w-14">Width</span>
            <input
              type="range" min={0} max={10} step={0.5} value={state.outlineWidth}
              onChange={(e) => actions.setOutlineWidth(Number(e.target.value))}
              className="flex-grow h-1 rounded-full appearance-none bg-slate-700 cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] text-slate-400 w-7 text-right">{state.outlineWidth}px</span>
          </div>
        )}
      </Section>

      {/* ── POSITION ────────────────────────────────────────────────────── */}
      <Section>
        <Label>Position</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {POSITIONS.map((pos) => (
            <button
              key={pos.key}
              type="button"
              onClick={() => actions.setPosition(pos.key)}
              className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                state.position === pos.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              <span className="block text-base leading-none">{pos.icon}</span>
              <span className="block mt-0.5 text-[10px]">{pos.key}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── CAPTION WIDTH ───────────────────────────────────────────────── */}
      <Section>
        <Label>Caption Width — {state.captionWidth}%</Label>
        <input
          type="range" min={20} max={100} step={5} value={state.captionWidth}
          onChange={(e) => actions.setCaptionWidth(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none bg-slate-700 cursor-pointer accent-indigo-500"
        />
      </Section>

      {/* ── TEXT ALIGNMENT ──────────────────────────────────────────────── */}
      <Section>
        <Label>Text Alignment</Label>
        <div className="flex gap-1.5">
          {(
            [
              { key: 'left', Icon: AlignLeft },
              { key: 'center', Icon: AlignCenter },
              { key: 'right', Icon: AlignRight },
            ] as { key: 'left' | 'center' | 'right'; Icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => actions.setTextAlign(key)}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all ${
                state.textAlign === key
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
};
