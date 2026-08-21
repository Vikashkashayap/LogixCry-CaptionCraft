'use client';

import React, { useCallback, useRef, useState } from 'react';
import { CaptionItem, CaptionStyle } from '../../types';
import { Caption, CaptionStyleKey, AspectRatioKey } from '../../types/editor';
import { useVideoEditor } from '../../hooks/useVideoEditor';
import { normalizeCaptions, captionsToApi, validateCaptions } from '../../lib/captionUtils';
import { getOriginalVideoUrl, renderVideoEditsApi } from '../../lib/api';
import { VideoPreview } from './VideoPreview';
import { CaptionList } from './CaptionList';
import { CaptionStyleSelector } from './CaptionStyleSelector';
import { CaptionCustomization } from './CaptionCustomization';
import { AspectRatioSelector } from './AspectRatioSelector';
import { RenderProgress } from './RenderProgress';
import { Timeline } from './Timeline';
import { AiEditPanel } from './AiEditPanel';
import { SilenceRemovalTool } from './SilenceRemovalTool';
import { MusicPanel } from './MusicPanel';
import { EffectsPanel } from './EffectsPanel';
import { FormatPresets } from './FormatPresets';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Clapperboard,
  AlertTriangle,
  Layers,
  Sliders,
  Film,
  Sparkles,
  Loader2,
  Type,
  VolumeX,
  Music,
  Maximize,
  Wand2,
} from 'lucide-react';

interface FullCaptionEditorProps {
  jobId: string;
  initialCaptions: CaptionItem[];
  initialStyle: CaptionStyle;
  initialAspectRatio?: AspectRatioKey;
  videoDuration?: number;
  onRenderStarted: () => void;
}

type RenderStatus = 'idle' | 'rendering' | 'completed' | 'failed';
type ActiveTab = 'ai' | 'captions' | 'silence' | 'music' | 'effects' | 'format' | 'customize';

export const FullCaptionEditor: React.FC<FullCaptionEditorProps> = ({
  jobId,
  initialCaptions,
  initialStyle,
  initialAspectRatio = '16:9',
  videoDuration = 0,
  onRenderStarted,
}) => {
  const normalizedInitial = normalizeCaptions(initialCaptions);
  const editor = useVideoEditor(normalizedInitial, initialStyle as CaptionStyleKey, initialAspectRatio);
  const { state } = editor;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(videoDuration);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderMessage, setRenderMessage] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const originalCaptionsRef = useRef<Caption[]>(normalizedInitial);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoUrl = getOriginalVideoUrl(jobId);

  const handleTimeUpdate = useCallback((t: number) => setCurrentTime(t), []);

  const handleVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el && el.duration) setDuration(el.duration);
    },
    []
  );

  const seekTo = useCallback((t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 9999, t));
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleRender = async () => {
    const result = validateCaptions(state.captions, duration > 0 ? duration : undefined);
    if (!result.valid) {
      setValidationErrors(result.errors.map((e) => e.message));
      return;
    }
    setValidationErrors([]);
    setRenderStatus('rendering');
    setRenderProgress(0);
    setRenderMessage('Sending project edit payload to FFmpeg pipeline...');
    setRenderError(null);

    try {
      await renderVideoEditsApi(jobId, {
        captions: captionsToApi(state.captions),
        style: state.style,
        extendedOptions: {
          fontFamily: state.fontFamily,
          fontSize: state.fontSize,
          textColor: state.textColor,
          backgroundEnabled: state.backgroundEnabled,
          backgroundColor: state.backgroundColor,
          backgroundOpacity: state.backgroundOpacity,
          outlineEnabled: state.outlineEnabled,
          outlineColor: state.outlineColor,
          outlineWidth: state.outlineWidth,
          position: state.position,
          captionWidth: state.captionWidth,
          textAlign: state.textAlign,
          aspectRatio: state.aspectRatio,
        },
        cuts: state.cuts,
        silenceSegments: state.silenceSegments,
        zooms: state.zooms,
        transitions: state.transitions,
        music: state.music,
        globalSpeed: state.globalSpeed,
        aspectRatio: state.aspectRatio,
      });

      setRenderMessage('Rendering video edits with FFmpeg...');
      onRenderStarted();
    } catch (err: any) {
      setRenderStatus('failed');
      setRenderError(err.message || 'Rendering failed. Please try again.');
    }
  };

  const handleResetCaptions = () => {
    if (showResetConfirm) {
      editor.setCaptions(originalCaptionsRef.current);
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const isRendering = renderStatus === 'rendering';

  return (
    <div
      className="flex flex-col bg-[#070b14]"
      style={{ height: 'calc(100vh - 76px)', overflow: 'hidden' }}
    >
      {/* ── TOP TOOLBAR ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-[#0d1323] border-b border-slate-800/80 z-10">
        {/* Left: title + undo/redo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25">
              <Film className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">AI Video Editor</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {state.captions.length} captions • {state.cuts.filter((c) => c.accepted).length} cuts •{' '}
                {state.zooms.filter((z) => z.accepted).length} zooms
              </p>
            </div>
          </div>

          <div className="w-px h-7 bg-slate-800" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={editor.undo}
              disabled={!editor.canUndo}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={editor.redo}
              disabled={!editor.canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-7 bg-slate-800" />

          {/* Reset buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={editor.resetStyle}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Center: Live overlay badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>Non-destructive Live Preview</span>
        </div>

        {/* Right: Render CTA */}
        <button
          onClick={handleRender}
          disabled={isRendering}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg ${
            isRendering
              ? 'bg-slate-700/80 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02]'
          }`}
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Rendering...
            </>
          ) : (
            <>
              <Clapperboard className="w-4 h-4" />
              Export Video
            </>
          )}
        </button>
      </div>

      {/* ── VALIDATION ERRORS BANNER ────────────────────────────────────── */}
      {(renderStatus !== 'idle' || validationErrors.length > 0) && (
        <div className="flex-shrink-0 px-4 py-2 bg-[#0d1323] border-b border-slate-800/60">
          {validationErrors.length > 0 && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/25">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-grow min-w-0">
                <p className="text-xs font-semibold text-rose-300">Fix before rendering:</p>
                <ul className="mt-0.5 space-y-0.5">
                  {validationErrors.slice(0, 2).map((m, i) => (
                    <li key={i} className="text-[11px] text-rose-400">
                      • {m}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setValidationErrors([])}
                className="text-slate-500 hover:text-slate-300 text-xs flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}
          {renderStatus !== 'idle' && (
            <RenderProgress
              status={renderStatus}
              progress={renderProgress}
              message={renderMessage}
              error={renderError}
            />
          )}
        </div>
      )}

      {/* ── MAIN WORKSPACE (Preview + Right Sidebar) ─────────────────────── */}
      <div className="flex-grow flex overflow-hidden min-h-0">
        {/* CENTER — Video Preview */}
        <div className="flex-grow flex flex-col items-center justify-center bg-[#070b14] p-3 overflow-hidden">
          <VideoPreview
            videoUrl={videoUrl}
            editorState={state}
            onTimeUpdate={handleTimeUpdate}
            onVideoRef={handleVideoRef}
            onAspectRatioChange={editor.setAspectRatio}
          />
        </div>

        {/* RIGHT SIDEBAR — Tools & Panels with Tab Navigation */}
        <div className="w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col bg-[#0a0e1a] border-l border-slate-800/80 overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex-shrink-0 flex overflow-x-auto border-b border-slate-800/80 bg-[#0d1323] no-scrollbar">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              ✨ AI Auto Edit
            </button>

            <button
              onClick={() => setActiveTab('captions')}
              className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'captions'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-sky-400" />
              Captions
            </button>

            <button
              onClick={() => setActiveTab('customize')}
              className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'customize'
                  ? 'border-violet-500 text-violet-300 bg-violet-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              🎨 Style & Colors
            </button>

            <button
              onClick={() => setActiveTab('silence')}
              className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'silence'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
              Silence
            </button>

            <button
              onClick={() => setActiveTab('music')}
              className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'music'
                  ? 'border-teal-500 text-teal-300 bg-teal-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-teal-400" />
              Music
            </button>

            <button
              onClick={() => setActiveTab('effects')}
              className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'effects'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              Effects
            </button>

            <button
              onClick={() => setActiveTab('format')}
              className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'format'
                  ? 'border-sky-500 text-sky-300 bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize className="w-3.5 h-3.5 text-sky-400" />
              Format
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-grow overflow-y-auto p-3.5 space-y-4">
            {/* TAB: AI AUTO EDIT */}
            {activeTab === 'ai' && (
              <AiEditPanel
                jobId={jobId}
                videoDuration={duration}
                aiPlan={state.aiAnalysis}
                onPlanReceived={editor.setAiAnalysis}
                onApplyAll={editor.applyAllAiSuggestions}
                onSeek={seekTo}
                onToggleCut={editor.toggleCutAccepted}
                onToggleZoom={editor.toggleZoomAccepted}
                onToggleHighlight={editor.toggleHighlightAccepted}
                onUseHookAsOpening={(hookStart) => seekTo(hookStart)}
              />
            )}

            {/* TAB: CAPTIONS LIST */}
            {activeTab === 'captions' && (
              <CaptionList
                captions={state.captions}
                currentTime={currentTime}
                videoDuration={duration}
                canUndo={editor.canUndo}
                canRedo={editor.canRedo}
                onUpdate={editor.updateCaption}
                onDelete={editor.deleteCaption}
                onAdd={editor.addCaption}
                onSeek={seekTo}
                onUndo={editor.undo}
                onRedo={editor.redo}
                onOpenStyles={() => setActiveTab('customize')}
              />
            )}

            {/* TAB: SILENCE REMOVAL */}
            {activeTab === 'silence' && (
              <SilenceRemovalTool
                jobId={jobId}
                silenceSegments={state.silenceSegments}
                onSilenceDetected={editor.setSilenceSegments}
                onToggleSilence={editor.toggleSilenceAccepted}
                onAcceptAllSilence={editor.acceptAllSilence}
                onSeek={seekTo}
              />
            )}

            {/* TAB: MUSIC */}
            {activeTab === 'music' && (
              <MusicPanel musicConfig={state.music} onUpdateMusic={editor.setMusic} />
            )}

            {/* TAB: EFFECTS & SPEED */}
            {activeTab === 'effects' && (
              <EffectsPanel
                currentTime={currentTime}
                duration={duration}
                zooms={state.zooms}
                transitions={state.transitions}
                globalSpeed={state.globalSpeed}
                onAddZoom={editor.addZoom}
                onUpdateZoom={editor.updateZoom}
                onDeleteZoom={editor.deleteZoom}
                onAddTransition={editor.addTransition}
                onDeleteTransition={editor.deleteTransition}
                onSetGlobalSpeed={editor.setGlobalSpeed}
                onSeek={seekTo}
              />
            )}

            {/* TAB: FORMAT & SOCIAL PRESETS */}
            {activeTab === 'format' && (
              <FormatPresets
                currentAspectRatio={state.aspectRatio}
                currentStyle={state.style}
                onApplyPreset={(cfg) => {
                  editor.setAspectRatio(cfg.aspectRatio);
                  editor.setStyle(cfg.style);
                  if (cfg.fontSize) editor.setFontSize(cfg.fontSize);
                  if (cfg.captionWidth) editor.setCaptionWidth(cfg.captionWidth);
                  if (cfg.position) editor.setPosition(cfg.position);
                }}
                onApplyAiPreset={(type) => {
                  if (type === 'reel') {
                    editor.setAspectRatio('9:16');
                    editor.setStyle('reels');
                    editor.setCaptionWidth(85);
                  } else if (type === 'youtube') {
                    editor.setAspectRatio('16:9');
                    editor.setStyle('youtube');
                    editor.setCaptionWidth(80);
                  }
                }}
              />
            )}

            {/* TAB: CUSTOMIZE & STYLES */}
            {activeTab === 'customize' && (
              <div className="space-y-4">
                <section>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Style Preset
                  </p>
                  <CaptionStyleSelector value={state.style} onChange={editor.setStyle} />
                </section>

                <div className="h-px bg-slate-800" />

                <CaptionCustomization
                  state={state}
                  actions={{
                    setFontFamily: editor.setFontFamily,
                    setFontSize: editor.setFontSize,
                    setTextColor: editor.setTextColor,
                    setBackgroundEnabled: editor.setBackgroundEnabled,
                    setBackgroundColor: editor.setBackgroundColor,
                    setBackgroundOpacity: editor.setBackgroundOpacity,
                    setOutlineEnabled: editor.setOutlineEnabled,
                    setOutlineColor: editor.setOutlineColor,
                    setOutlineWidth: editor.setOutlineWidth,
                    setPosition: editor.setPosition,
                    setCaptionWidth: editor.setCaptionWidth,
                    setTextAlign: editor.setTextAlign,
                    resetStyle: editor.resetStyle,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM MULTI-TRACK TIMELINE ─────────────────────────────────── */}
      <div className="flex-shrink-0">
        <Timeline
          editorState={state}
          currentTime={currentTime}
          duration={duration}
          onSeek={seekTo}
          onSelectTrackItem={(track) => {
            if (track === 'video') setActiveTab('ai');
            else if (track === 'caption') setActiveTab('captions');
            else if (track === 'audio') setActiveTab('music');
            else if (track === 'effect') setActiveTab('effects');
          }}
        />
      </div>
    </div>
  );
};
