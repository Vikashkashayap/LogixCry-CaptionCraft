'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MusicConfig } from '../../types/editor';
import { getMusicPresetsApi, uploadMusicApi } from '../../lib/api';
import { Music, Upload, Play, Pause, Trash2, Volume2, VolumeX, Sliders, Loader2, Check } from 'lucide-react';

interface MusicPanelProps {
  musicConfig?: MusicConfig;
  onUpdateMusic: (config?: MusicConfig) => void;
}

export const MusicPanel: React.FC<MusicPanelProps> = ({
  musicConfig,
  onUpdateMusic,
}) => {
  const [presets, setPresets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getMusicPresetsApi().then(setPresets).catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await uploadMusicApi(file);
      onUpdateMusic({
        trackId: data.trackId,
        trackName: data.trackName,
        customAudioPath: data.filePath,
        customAudioUrl: data.url,
        volume: 0.12,
        originalAudioVolume: 1.0,
        fadeIn: 1.0,
        fadeOut: 1.5,
        loop: true,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to upload music.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPreset = (preset: any) => {
    onUpdateMusic({
      trackId: preset.id,
      trackName: preset.name,
      customAudioUrl: preset.url,
      volume: 0.12,
      originalAudioVolume: 1.0,
      fadeIn: 1.0,
      fadeOut: 1.5,
      loop: true,
    });
  };

  const togglePreview = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Box */}
      <div className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Background Music</h3>
              <p className="text-[10px] text-slate-400">Royalty-Free Audio &amp; Custom Upload</p>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-teal-500/50 rounded-xl bg-slate-900/40 cursor-pointer transition-all">
          <input
            type="file"
            accept="audio/mp3,audio/wav,audio/m4a,audio/aac"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin mb-1" />
          ) : (
            <Upload className="w-5 h-5 text-teal-400 mb-1" />
          )}
          <span className="text-xs font-semibold text-slate-200">
            {uploading ? 'Processing Audio...' : 'Upload Music Track'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">MP3, WAV, M4A, AAC (Max 50MB)</span>
        </label>
      </div>

      {/* Preset Tracks List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Royalty-Free Presets
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {presets.map((p) => {
            const isSelected = musicConfig?.trackId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-teal-950/40 border-teal-500/60 text-teal-200'
                    : 'bg-[#0d1220] border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.category}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-teal-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Music Track Controls */}
      {musicConfig && (
        <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                Active Track
              </span>
              <p className="text-xs font-bold text-white truncate">{musicConfig.trackName || 'Custom Audio'}</p>
            </div>

            <button
              onClick={() => onUpdateMusic(undefined)}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Remove Music"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Sliders */}
          <div className="space-y-2.5 pt-1">
            {/* Music Volume */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                <span>Music Volume:</span>
                <span className="font-mono text-teal-400">{Math.round(musicConfig.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={musicConfig.volume}
                onChange={(e) =>
                  onUpdateMusic({ ...musicConfig, volume: parseFloat(e.target.value) })
                }
                className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Voice Volume */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                <span>Voice Audio Volume:</span>
                <span className="font-mono text-sky-400">
                  {Math.round((musicConfig.originalAudioVolume ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={musicConfig.originalAudioVolume ?? 1.0}
                onChange={(e) =>
                  onUpdateMusic({
                    ...musicConfig,
                    originalAudioVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Fade In & Out */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Fade In (s)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={musicConfig.fadeIn ?? 1.0}
                  onChange={(e) =>
                    onUpdateMusic({ ...musicConfig, fadeIn: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1 rounded bg-[#0b101d] border border-slate-700 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Fade Out (s)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={musicConfig.fadeOut ?? 1.5}
                  onChange={(e) =>
                    onUpdateMusic({ ...musicConfig, fadeOut: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1 rounded bg-[#0b101d] border border-slate-700 text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Mute voice toggle */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={musicConfig.muteOriginalAudio || false}
                onChange={(e) =>
                  onUpdateMusic({ ...musicConfig, muteOriginalAudio: e.target.checked })
                }
                className="rounded accent-rose-500"
              />
              <span className="text-[11px] text-slate-300">Mute original voice audio</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
