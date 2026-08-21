'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { EditorState, AspectRatioKey } from '../../types/editor';
import { getActiveCaptionIndex, buildOverlayCaptionStyle } from '../../lib/captionUtils';
import { ASPECT_RATIO_CONFIGS, ASPECT_RATIO_LIST } from '../../lib/aspectRatioConfig';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, Smartphone, Monitor, Square } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl: string;
  editorState: EditorState;
  onTimeUpdate?: (time: number) => void;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
  onAspectRatioChange?: (ratio: AspectRatioKey) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  editorState,
  onTimeUpdate,
  onVideoRef,
  onAspectRatioChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [containerWidth, setContainerWidth] = useState(640);
  const [currentZoomScale, setCurrentZoomScale] = useState(1.0);

  const ratioConfig = ASPECT_RATIO_CONFIGS[editorState.aspectRatio] || ASPECT_RATIO_CONFIGS['16:9'];

  // Expose video element ref to parent
  useEffect(() => {
    onVideoRef?.(videoRef.current);
  }, [onVideoRef]);

  // Track container width for scaling font size
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Set playback rate when globalSpeed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = editorState.globalSpeed || 1.0;
    }
  }, [editorState.globalSpeed]);

  // Sync background music volume & mute state
  useEffect(() => {
    if (audioRef.current) {
      const musicVol = editorState.music?.volume ?? 0.12;
      audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, musicVol * volume));
    }
  }, [editorState.music, volume, isMuted]);

  // Sync voice volume
  useEffect(() => {
    if (videoRef.current) {
      if (editorState.music?.muteOriginalAudio) {
        videoRef.current.volume = 0;
      } else {
        const origVol = (editorState.music?.originalAudioVolume ?? 1.0) * volume;
        videoRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, origVol));
      }
    }
  }, [editorState.music, volume, isMuted]);

  // Caption scale factor: ratio of container width vs 1920px reference
  const captionScale = containerWidth / (ratioConfig.width || 1920);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    let t = video.currentTime;

    // Live Cut & Silence Skip Simulation during playback
    if (!video.paused) {
      const activeCut = editorState.cuts.find((c) => c.accepted && t >= c.start && t < c.end);
      if (activeCut) {
        video.currentTime = activeCut.end;
        t = activeCut.end;
      }

      const activeSilence = editorState.silenceSegments.find(
        (s) => s.accepted && t >= s.start && t < s.end
      );
      if (activeSilence) {
        video.currentTime = activeSilence.end;
        t = activeSilence.end;
      }
    }

    setCurrentTime(t);

    // Dynamic Zoom scale check
    const activeZoom = editorState.zooms.find((z) => z.accepted && t >= z.start && t <= z.end);
    setCurrentZoomScale(activeZoom ? activeZoom.scale : 1.0);

    const idx = getActiveCaptionIndex(editorState.captions, t);
    setActiveIdx(idx);
    onTimeUpdate?.(t);
  }, [editorState.captions, editorState.cuts, editorState.silenceSegments, editorState.zooms, onTimeUpdate]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      if (audioRef.current && editorState.music?.customAudioUrl) {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    } else {
      video.pause();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = parseFloat(e.target.value);
    video.currentTime = t;
    if (audioRef.current) {
      audioRef.current.currentTime = t;
    }
    setCurrentTime(t);
  };

  const seekToTime = (t: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(duration, t));
    video.currentTime = clamped;
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
  };

  const handleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Build overlay caption style
  const overlayStyle = buildOverlayCaptionStyle({
    fontFamily: editorState.fontFamily,
    fontSize: editorState.fontSize,
    textColor: editorState.textColor,
    backgroundEnabled: editorState.backgroundEnabled,
    backgroundColor: editorState.backgroundColor,
    backgroundOpacity: editorState.backgroundOpacity,
    outlineEnabled: editorState.outlineEnabled,
    outlineColor: editorState.outlineColor,
    outlineWidth: editorState.outlineWidth,
    textAlign: editorState.textAlign,
    captionWidth: editorState.captionWidth,
    position: editorState.position,
  });

  const activeCaption = activeIdx >= 0 ? editorState.captions[activeIdx] : null;
  const isKaraoke = editorState.style === 'karaoke';

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Background Audio Player if custom audio attached */}
      {editorState.music?.customAudioUrl && (
        <audio
          ref={audioRef}
          src={editorState.music.customAudioUrl}
          loop={editorState.music.loop ?? true}
          preload="auto"
        />
      )}

      {/* Top Format Selector Pill Bar */}
      {onAspectRatioChange && (
        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 pb-1">
          {ASPECT_RATIO_LIST.map((cfg) => {
            const isSelected = editorState.aspectRatio === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => onAspectRatioChange(cfg.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                {cfg.id === '16:9' && <Monitor className="w-3 h-3" />}
                {cfg.id === '9:16' && <Smartphone className="w-3 h-3 text-pink-400" />}
                {cfg.id === '1:1' && <Square className="w-3 h-3 text-amber-400" />}
                {cfg.id === '4:5' && <Smartphone className="w-3 h-3 text-emerald-400" />}
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">({cfg.platformLabel})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Video Canvas Container (True Aspect Ratio Fitted Box) */}
      <div className="flex-grow flex items-center justify-center min-h-0 min-w-0 p-2 overflow-hidden">
        <div
          ref={containerRef}
          className="relative bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 flex items-center justify-center"
          style={{
            aspectRatio: ratioConfig.cssRatio,
            maxHeight: '100%',
            maxWidth: '100%',
            height: '100%',
            width: 'auto',
            '--caption-scale': captionScale,
          } as React.CSSProperties}
        >
          {/* Video element with scale-to-cover and center crop */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
            style={{ transform: `scale(${currentZoomScale})` }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />

          {/* Format indicator badge in preview */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-slate-300 pointer-events-none z-10">
            {ratioConfig.label} ({ratioConfig.width}x{ratioConfig.height})
          </div>

          {/* Caption overlay */}
          {activeCaption && (
            <div
              style={overlayStyle}
              className={`pointer-events-none z-10 select-none transition-all duration-100 ${
                isKaraoke ? 'animate-pulse' : ''
              }`}
            >
              {activeCaption.text}
            </div>
          )}

          {/* Play/pause overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer group z-20"
            onClick={togglePlay}
          >
            {!isPlaying && (
              <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-black/70 transition-all shadow-2xl">
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 space-y-2 px-4 pb-1">
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 rounded-full appearance-none bg-slate-700 cursor-pointer accent-indigo-500"
          style={{
            backgroundImage: `linear-gradient(to right, #6366f1 ${(currentTime / (duration || 1)) * 100}%, #334155 0%)`,
          }}
        />

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => seekToTime(0)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Restart"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4" fill="currentColor" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 rounded-full appearance-none bg-slate-700 cursor-pointer accent-indigo-500"
            />
          </div>

          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 hidden sm:block">
              {ratioConfig.label} • {editorState.globalSpeed}x • Live Canvas
            </span>
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
