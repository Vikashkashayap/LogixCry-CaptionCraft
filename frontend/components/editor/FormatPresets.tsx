'use client';

import React from 'react';
import { AspectRatioKey, CaptionStyleKey } from '../../types/editor';
import { Smartphone, Monitor, Instagram, Youtube, Sparkles, Sliders } from 'lucide-react';

interface FormatPresetsProps {
  currentAspectRatio: AspectRatioKey;
  currentStyle: CaptionStyleKey;
  onApplyPreset: (config: {
    aspectRatio: AspectRatioKey;
    style: CaptionStyleKey;
    fontSize?: number;
    captionWidth?: number;
    position?: 'top' | 'center' | 'bottom';
  }) => void;
  onApplyAiPreset?: (presetType: 'reel' | 'youtube' | 'short') => void;
}

export const FormatPresets: React.FC<FormatPresetsProps> = ({
  currentAspectRatio,
  currentStyle,
  onApplyPreset,
  onApplyAiPreset,
}) => {
  const SOCIAL_PRESETS = [
    {
      id: 'instagram-reels',
      name: 'Instagram Reels',
      ratio: '9:16' as AspectRatioKey,
      dim: '1080x1920',
      icon: Instagram,
      style: 'reels' as CaptionStyleKey,
      captionWidth: 85,
      position: 'center' as const,
      fontSize: 52,
    },
    {
      id: 'youtube-shorts',
      name: 'YouTube Shorts',
      ratio: '9:16' as AspectRatioKey,
      dim: '1080x1920',
      icon: Youtube,
      style: 'bold' as CaptionStyleKey,
      captionWidth: 85,
      position: 'center' as const,
      fontSize: 50,
    },
    {
      id: 'youtube-standard',
      name: 'YouTube Long-form',
      ratio: '16:9' as AspectRatioKey,
      dim: '1920x1080',
      icon: Monitor,
      style: 'youtube' as CaptionStyleKey,
      captionWidth: 80,
      position: 'bottom' as const,
      fontSize: 44,
    },
    {
      id: 'instagram-feed',
      name: 'Instagram Feed',
      ratio: '4:5' as AspectRatioKey,
      dim: '1080x1350',
      icon: Smartphone,
      style: 'highlight' as CaptionStyleKey,
      captionWidth: 80,
      position: 'bottom' as const,
      fontSize: 48,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Social Presets */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Social Media Presets
        </span>
        <div className="grid grid-cols-1 gap-2">
          {SOCIAL_PRESETS.map((p) => {
            const Icon = p.icon;
            const isMatch = currentAspectRatio === p.ratio && currentStyle === p.style;
            return (
              <button
                key={p.id}
                onClick={() =>
                  onApplyPreset({
                    aspectRatio: p.ratio,
                    style: p.style,
                    fontSize: p.fontSize,
                    captionWidth: p.captionWidth,
                    position: p.position,
                  })
                }
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isMatch
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                    : 'bg-[#0e1424] border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {p.ratio} ({p.dim}) • {p.style} style
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-400">
                  {p.ratio}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Auto Edit Presets */}
      {onApplyAiPreset && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Auto Edit Presets
          </span>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => onApplyAiPreset('reel')}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 text-left hover:border-purple-500/60 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-200">AI Reel Preset</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  9:16 Fast-Paced
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Removes silence + dynamic reels captions + subtle emphasis zooms + low background music.
              </p>
            </button>

            <button
              onClick={() => onApplyAiPreset('youtube')}
              className="p-3 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30 text-left hover:border-sky-500/60 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-200">AI YouTube Preset</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  16:9 Cinema
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Conservative cuts + clean professional lower-third captions + smooth scene transitions.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
