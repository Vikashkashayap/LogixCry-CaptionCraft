import React, { useState } from 'react';
import { CaptionItem, CaptionStyle, JobStatusResponse } from '../types';
import { deleteJobApi, getDownloadUrl, getPreviewStreamUrl } from '../lib/api';
import { CaptionEditor } from './CaptionEditor';
import { Download, FileText, Code, CheckCircle, RotateCcw, Edit2, Play, Sparkles, Trash2, Loader2 } from 'lucide-react';

interface ResultViewProps {
  jobStatus: JobStatusResponse;
  onReset: () => void;
  onRerenderRequested: (captions: CaptionItem[], newStyle?: CaptionStyle) => void;
  isReRendering?: boolean;
}

export const ResultView: React.FC<ResultViewProps> = ({
  jobStatus,
  onReset,
  onRerenderRequested,
  isReRendering,
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const previewUrl = getPreviewStreamUrl(jobStatus.jobId);
  const downloadMp4Url = getDownloadUrl(jobStatus.jobId, 'mp4');
  const downloadSrtUrl = getDownloadUrl(jobStatus.jobId, 'srt');
  const downloadAssUrl = getDownloadUrl(jobStatus.jobId, 'ass');
  const downloadJsonUrl = getDownloadUrl(jobStatus.jobId, 'json');

  const handleDeleteJob = async () => {
    try {
      setIsDeleting(true);
      await deleteJobApi(jobStatus.jobId);
      onReset();
    } catch (err: any) {
      alert(`Delete failed: ${err.message || 'Unknown error'}`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      {/* Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-emerald-950/30">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg">Captions Generated & Burned Successfully!</h3>
            <p className="text-xs text-emerald-400/90">
              Your captioned video is processed and ready for preview or download below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700/60 shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start New Video
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player + Action Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Video Player Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl aspect-video group ring-1 ring-slate-800">
            <video
              src={previewUrl}
              controls
              controlsList="nodownload"
              className="w-full h-full object-contain"
              poster=""
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <Play className="w-3.5 h-3.5" /> Streamed Directly with Subtitles Burned
            </span>
            <span>Style: <strong className="text-slate-200 capitalize">{jobStatus.style || 'Classic'}</strong></span>
          </div>
        </div>

        {/* Action Downloads Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Download Exports
            </h3>

            {/* Main MP4 Download */}
            <a
              href={downloadMp4Url}
              download
              className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.01]"
            >
              <Download className="w-4 h-4" />
              Download Captioned MP4 Video
            </a>

            {/* Subtitle File Downloads */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <a
                href={downloadSrtUrl}
                download
                className="py-2.5 px-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Download standard SRT subtitle file"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>SRT</span>
              </a>

              <a
                href={downloadAssUrl}
                download
                className="py-2.5 px-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Download styled ASS subtitle file"
              >
                <FileText className="w-3.5 h-3.5 text-pink-400" />
                <span>ASS</span>
              </a>

              <a
                href={downloadJsonUrl}
                download
                className="py-2.5 px-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Download raw timestamp JSON"
              >
                <Code className="w-3.5 h-3.5 text-violet-400" />
                <span>JSON</span>
              </a>
            </div>

            {/* Editor Toggle */}
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="w-full py-3 px-4 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {showEditor ? 'Hide Caption Editor' : '✏️ Edit Captions & Re-burn Video'}
            </button>

            {/* Delete Option */}
            <div className="pt-3 border-t border-slate-800/80">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteJob}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/30"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Permanent Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Video from Server & DB</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Caption Editor */}
      {showEditor && jobStatus.captions && (
        <CaptionEditor
          initialCaptions={jobStatus.captions}
          jobId={jobStatus.jobId}
          currentStyle={jobStatus.style || 'classic'}
          onRerenderRequested={onRerenderRequested}
          isReRendering={isReRendering}
        />
      )}
    </div>
  );
};
