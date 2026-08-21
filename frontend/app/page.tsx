'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { UploadCard } from '../components/UploadCard';
import { OptionsSelector } from '../components/OptionsSelector';
import { ProcessingProgress } from '../components/ProcessingProgress';
import { ResultView } from '../components/ResultView';
import { HistorySection } from '../components/HistorySection';
import { FullCaptionEditor } from '../components/editor/FullCaptionEditor';
import { generateCaptionsApi, getHistoryApi, getJobStatusApi } from '../lib/api';
import { CaptionStyle, JobHistoryItem, JobStatusResponse, LanguageOption } from '../types';
import { Wand2, ArrowRight, Zap } from 'lucide-react';

// ─── Phase states ─────────────────────────────────────────────────────────────
//  'upload'      → Upload + options + generate button
//  'processing'  → Gemini AI + initial FFmpeg render in progress
//  'editor'      → Caption editor (after Gemini completes, before user renders)
//  'rendering'   → User clicked "Render Video", FFmpeg re-rendering
//  'result'      → Final rendered video ready for download

type AppPhase = 'upload' | 'processing' | 'editor' | 'rendering' | 'result';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<LanguageOption>('auto');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('classic');

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Track which phase the UI is in
  const [phase, setPhase] = useState<AppPhase>('upload');

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshHistory = async () => {
    try {
      const items = await getHistoryApi();
      setHistory(items);
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  /**
   * Poll job status from backend.
   * `onComplete` fires when status transitions to completed/failed.
   */
  const startPollingStatus = (jobId: string, onComplete?: (status: JobStatusResponse) => void) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const statusData = await getJobStatusApi(jobId);
        setJobStatus(statusData);

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsUploading(false);
          refreshHistory();
          onComplete?.(statusData);
        }
      } catch (err: any) {
        console.error('[Polling Error]:', err);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // ── GENERATE CAPTIONS (Gemini flow) ──────────────────────────────────────────
  const handleGenerateCaptions = async () => {
    if (!selectedFile) return;

    setGlobalError(null);
    setIsUploading(true);
    setPhase('processing');
    setJobStatus({
      jobId: 'temp',
      status: 'uploading',
      progress: 5,
      message: 'Starting secure video upload...',
    });

    try {
      const response = await generateCaptionsApi(
        selectedFile,
        language,
        captionStyle,
        (percent) => {
          setJobStatus((prev) =>
            prev
              ? {
                  ...prev,
                  progress: Math.min(20, Math.round((percent / 100) * 20)),
                  message: `Uploading video to server: ${percent}%`,
                }
              : null
          );
        }
      );

      setActiveJobId(response.jobId);

      // Poll until Gemini + initial render completes, then open editor
      startPollingStatus(response.jobId, (completedStatus) => {
        if (completedStatus.status === 'completed') {
          // Open caption editor — do NOT jump to ResultView yet
          setPhase('editor');
        } else {
          setPhase('upload');
          setGlobalError(completedStatus.error || 'Processing failed. Please try again.');
        }
      });
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      setIsUploading(false);
      setPhase('upload');
      setGlobalError(err.message || 'Failed to upload video.');
      setJobStatus(null);
    }
  };

  // ── RENDER STARTED (from FullCaptionEditor) ──────────────────────────────────
  const handleRenderStarted = () => {
    if (!activeJobId) return;
    setPhase('rendering');

    // Poll until the re-render completes, then show ResultView
    startPollingStatus(activeJobId, (completedStatus) => {
      if (completedStatus.status === 'completed') {
        setPhase('result');
      } else {
        // Render failed — go back to editor
        setPhase('editor');
        setGlobalError(completedStatus.error || 'Video rendering failed. Please try again.');
      }
    });
  };

  // ── HISTORY SELECTION ────────────────────────────────────────────────────────
  const handleSelectHistoryJob = async (jobId: string) => {
    try {
      setGlobalError(null);
      const statusData = await getJobStatusApi(jobId);
      setActiveJobId(jobId);
      setJobStatus(statusData);
      if (statusData.status === 'completed') {
        // Completed history job → go straight to result
        setPhase('result');
      } else if (statusData.status !== 'failed') {
        setPhase('processing');
        startPollingStatus(jobId, (completedStatus) => {
          if (completedStatus.status === 'completed') {
            setPhase('editor');
          }
        });
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Unable to load previous job details.');
    }
  };

  // ── BACK TO EDITOR ───────────────────────────────────────────────────────────
  const handleBackToEditor = () => {
    setPhase('editor');
    setGlobalError(null);
  };

  // ── RESET ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setSelectedFile(null);
    setActiveJobId(null);
    setJobStatus(null);
    setIsUploading(false);
    setGlobalError(null);
    setPhase('upload');
    refreshHistory();
  };

  const isProcessing = phase === 'processing' || phase === 'rendering';

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white ${phase === 'editor' ? 'overflow-hidden h-screen' : ''}`}>
      <div>
        <Header />

        <main className={`${phase === 'editor' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'} space-y-10`}>
          {/* HERO — only shown on upload screen */}
          {phase === 'upload' && (
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Next-Gen Video Understanding &amp; Subtitle Burning</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                AI Video Caption Generator
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal">
                Upload your video and automatically generate accurate, beautifully styled captions in seconds using Gemini Flash &amp; FFmpeg.
              </p>
            </div>
          )}

          {/* GLOBAL ERROR BANNER */}
          {globalError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center max-w-2xl mx-auto">
              {globalError}
            </div>
          )}

          {/* ── STATE: UPLOAD + OPTIONS ───────────────────────────────────────── */}
          {phase === 'upload' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <UploadCard
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                disabled={isUploading}
              />

              <OptionsSelector
                language={language}
                setLanguage={setLanguage}
                captionStyle={captionStyle}
                setCaptionStyle={setCaptionStyle}
                disabled={isUploading}
              />

              {/* GENERATE BUTTON */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={handleGenerateCaptions}
                  className={`w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-xl ${
                    selectedFile && !isUploading
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 hover:scale-[1.02] cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  <span>Generate Captions</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* RECENT HISTORY */}
              <div className="pt-6">
                <HistorySection
                  history={history}
                  onSelectJob={handleSelectHistoryJob}
                  onRefresh={refreshHistory}
                />
              </div>
            </div>
          )}

          {/* ── STATE: PROCESSING (Gemini AI / initial render) ────────────────── */}
          {isProcessing && jobStatus && (
            <div className="py-6 max-w-2xl mx-auto w-full">
              <ProcessingProgress
                status={jobStatus.status}
                progress={jobStatus.progress}
                message={jobStatus.message}
                error={jobStatus.error}
                onRetry={handleReset}
              />
            </div>
          )}

          {/* ── STATE: CAPTION EDITOR ─────────────────────────────────────────── */}
          {phase === 'editor' && activeJobId && jobStatus && (
            <div className="w-full">
              <FullCaptionEditor
                jobId={activeJobId}
                initialCaptions={jobStatus.captions || []}
                initialStyle={jobStatus.style || 'classic'}
                videoDuration={jobStatus.duration || 0}
                onRenderStarted={handleRenderStarted}
              />
            </div>
          )}

          {/* ── STATE: RESULT (final rendered video) ──────────────────────────── */}
          {phase === 'result' && jobStatus && (
            <ResultView
              jobStatus={jobStatus}
              onReset={handleReset}
              onBackToEditor={handleBackToEditor}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
