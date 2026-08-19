import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, X, Clock, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadCardProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export const UploadCard: React.FC<UploadCardProps> = ({ selectedFile, onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload MP4, MOV, WebM, or MKV.');
      return;
    }

    const maxSizeMb = 200;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`File is too large. Maximum allowed size is ${maxSizeMb}MB.`);
      return;
    }

    // Create object URL for local preview & duration probing
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoEl.src);
      setVideoDuration(videoEl.duration);
    };
    videoEl.src = url;

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setVideoDuration(null);
    setErrorMessage(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-700/70 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/80'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-semibold text-white mb-1">
            Drag and drop your video file here
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            or <span className="text-indigo-400 font-medium hover:underline">browse from device</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50">MP4, MOV, WebM, MKV</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50">Max 200 MB</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50">Rec. 1–2 Minutes</span>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-5 border border-slate-700/70 bg-slate-900/60 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {previewUrl && (
              <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex-shrink-0 group">
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700">
                    Preview
                  </span>
                </div>
              </div>
            )}

            <div className="flex-grow space-y-2 w-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-white truncate max-w-xs sm:max-w-md text-base">
                    {selectedFile.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready for AI captioning</span>
                  </div>
                </div>

                <button
                  onClick={handleRemove}
                  disabled={disabled}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span>Size: <strong className="text-slate-200">{formatFileSize(selectedFile.size)}</strong></span>
                </div>

                {videoDuration !== null && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Duration: <strong className="text-slate-200">{formatDuration(videoDuration)}</strong></span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <FileVideo className="w-3.5 h-3.5 text-slate-500" />
                  <span>Format: <strong className="text-slate-200">{selectedFile.type || 'Video'}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
