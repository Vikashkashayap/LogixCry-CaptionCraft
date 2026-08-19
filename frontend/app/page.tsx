'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { UploadCard } from '../components/UploadCard';
import { OptionsSelector } from '../components/OptionsSelector';
import { ProcessingProgress } from '../components/ProcessingProgress';
import { ResultView } from '../components/ResultView';
import { HistorySection } from '../components/HistorySection';
import { generateCaptionsApi, getHistoryApi, getJobStatusApi, rerenderCaptionsApi } from '../lib/api';
import { CaptionItem, CaptionStyle, JobHistoryItem, JobStatusResponse, LanguageOption } from '../types';
import { Wand2, ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<LanguageOption>('auto');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('classic');

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isReRendering, setIsReRendering] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

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

  // Poll job status from backend
  const startPollingStatus = (jobId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const statusData = await getJobStatusApi(jobId);
        setJobStatus(statusData);

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsUploading(false);
          setIsReRendering(false);
          refreshHistory();
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

  const handleGenerateCaptions = async () => {
    if (!selectedFile) return;

    setGlobalError(null);
    setIsUploading(true);
    setUploadProgress(0);
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
          setUploadProgress(percent);
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
      startPollingStatus(response.jobId);
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      setIsUploading(false);
      setGlobalError(err.message || 'Failed to upload video.');
      setJobStatus(null);
    }
  };

  const handleSelectHistoryJob = async (jobId: string) => {
    try {
      setGlobalError(null);
      const statusData = await getJobStatusApi(jobId);
      setActiveJobId(jobId);
      setJobStatus(statusData);
      if (statusData.status !== 'completed' && statusData.status !== 'failed') {
        startPollingStatus(jobId);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Unable to load previous job details.');
    }
  };

  const handleRerender = async (newCaptions: CaptionItem[], newStyle?: CaptionStyle) => {
    if (!activeJobId) return;

    setIsReRendering(true);
    try {
      await rerenderCaptionsApi(activeJobId, newCaptions, newStyle || captionStyle);
      startPollingStatus(activeJobId);
    } catch (err: any) {
      console.error('[Rerender Error]:', err);
      setIsReRendering(false);
      setGlobalError(err.message || 'Failed to trigger video re-render.');
    }
  };

  const handleReset = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setSelectedFile(null);
    setActiveJobId(null);
    setJobStatus(null);
    setIsUploading(false);
    setIsReRendering(false);
    setGlobalError(null);
    refreshHistory();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        <Header />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* HERO SECTION */}
          {!jobStatus && (
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Next-Gen Video Understanding & Subtitle Burning</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                AI Video Caption Generator
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal">
                Upload your video and automatically generate accurate, beautifully styled captions in seconds using Gemini Flash & FFmpeg.
              </p>
            </div>
          )}

          {/* MAIN APPLICATION WORKFLOW */}
          {globalError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center max-w-2xl mx-auto">
              {globalError}
            </div>
          )}

          {/* STATE 1: UPLOAD & OPTIONS */}
          {!jobStatus && (
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

              {/* RECENT GENERATIONS FROM MONGODB */}
              <div className="pt-6">
                <HistorySection
                  history={history}
                  onSelectJob={handleSelectHistoryJob}
                  onRefresh={refreshHistory}
                />
              </div>
            </div>
          )}

          {/* STATE 2: PROCESSING PROGRESS */}
          {jobStatus && jobStatus.status !== 'completed' && (
            <div className="py-6">
              <ProcessingProgress
                status={jobStatus.status}
                progress={jobStatus.progress}
                message={jobStatus.message}
                error={jobStatus.error}
                onRetry={handleReset}
              />
            </div>
          )}

          {/* STATE 3: COMPLETED RESULT */}
          {jobStatus && jobStatus.status === 'completed' && (
            <ResultView
              jobStatus={jobStatus}
              onReset={handleReset}
              onRerenderRequested={handleRerender}
              isReRendering={isReRendering}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
