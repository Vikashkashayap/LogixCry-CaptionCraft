import { ApiResponse, CaptionItem, CaptionStyle, JobHistoryItem, JobStatusResponse, LanguageOption } from '../types';
import { RenderPayload } from '../types/editor';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Upload video file and launch caption generation pipeline
 */
export async function generateCaptionsApi(
  file: File,
  language: LanguageOption,
  captionStyle: CaptionStyle,
  onUploadProgress?: (percent: number) => void
): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('language', language);
  formData.append('captionStyle', captionStyle);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/captions/generate`);

    if (onUploadProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onUploadProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const json: ApiResponse<{ jobId: string }> = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success && json.data) {
          resolve(json.data);
        } else {
          reject(new Error(json.error?.message || 'Video upload failed.'));
        }
      } catch {
        reject(new Error('Failed to parse server response.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during video upload. Check server connection.'));
    };

    xhr.send(formData);
  });
}

/**
 * Poll job status and progress from backend
 */
export async function getJobStatusApi(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE}/captions/status/${jobId}`, {
    cache: 'no-store',
  });
  const json: ApiResponse<JobStatusResponse> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to fetch job status');
  }
  return json.data;
}

/**
 * Fetch recent generation history from database
 */
export async function getHistoryApi(): Promise<JobHistoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/captions/history`, {
      cache: 'no-store',
    });
    const json: ApiResponse<JobHistoryItem[]> = await res.json();
    if (res.ok && json.success && json.data) {
      return json.data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Permanently delete a job and its video files from MongoDB & server storage
 */
export async function deleteJobApi(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/captions/job/${jobId}`, {
    method: 'DELETE',
  });
  const json: ApiResponse = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to delete job.');
  }
}

/**
 * Request re-rendering with full editor state (captions + style + custom options).
 * This does NOT call Gemini — FFmpeg only.
 */
export async function rerenderCaptionsApi(
  jobId: string,
  payload: RenderPayload
): Promise<void> {
  const res = await fetch(`${API_BASE}/captions/rerender/${jobId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      captions: payload.captions,
      captionStyle: payload.style,
      fontFamily: payload.fontFamily,
      fontSize: payload.fontSize,
      textColor: payload.textColor,
      backgroundEnabled: payload.backgroundEnabled,
      backgroundColor: payload.backgroundColor,
      backgroundOpacity: payload.backgroundOpacity,
      outlineEnabled: payload.outlineEnabled,
      outlineColor: payload.outlineColor,
      outlineWidth: payload.outlineWidth,
      position: payload.position,
      captionWidth: payload.captionWidth,
      textAlign: payload.textAlign,
      aspectRatio: payload.aspectRatio,
    }),
  });
  const json: ApiResponse = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to trigger video re-render.');
  }
}

/**
 * Legacy overload for simple rerender (captions + style only).
 * Kept for backward compatibility with HistorySection etc.
 */
export async function rerenderCaptionsSimpleApi(
  jobId: string,
  captions: CaptionItem[],
  captionStyle?: CaptionStyle
): Promise<void> {
  const res = await fetch(`${API_BASE}/captions/rerender/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ captions, captionStyle }),
  });
  const json: ApiResponse = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to trigger video re-render.');
  }
}

/**
 * Get direct download URL for files
 */
export function getDownloadUrl(jobId: string, type: 'mp4' | 'srt' | 'ass' | 'json'): string {
  return `${API_BASE}/captions/file/${jobId}/download?type=${type}`;
}

/**
 * Get video preview stream URL
 */
export function getPreviewStreamUrl(jobId: string): string {
  return `${API_BASE}/captions/file/${jobId}/preview`;
}

/**
 * Get the original (unprocessed) video stream URL for editor preview.
 * Uses the dedicated /original endpoint that serves the uploaded input file.
 */
export function getOriginalVideoUrl(jobId: string): string {
  return `${API_BASE}/captions/file/${jobId}/original`;
}

// ─── PHASE 2: AI VIDEO EDITOR APIS ──────────────────────────────────────────

/**
 * Trigger Gemini AI video analysis for scenes, cuts, highlights, zooms, transitions, hook.
 */
export async function analyzeVideoApi(videoId: string): Promise<{ analysisId: string }> {
  const res = await fetch(`${API_BASE}/video/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to start AI video analysis.');
  }
  return json.data;
}

/**
 * Poll AI video analysis status
 */
export async function getAnalysisStatusApi(analysisId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/video/analyze/status/${analysisId}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch analysis status.');
  }
  return json.data;
}

/**
 * Direct Auto-Edit plan generation
 */
export async function autoEditApi(videoId: string, options?: any): Promise<any> {
  const res = await fetch(`${API_BASE}/video/auto-edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, options }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to generate AI auto-edit plan.');
  }
  return json.data;
}

/**
 * Detect silence intervals using FFmpeg audio filter
 */
export async function detectSilenceApi(
  videoId: string,
  minDuration?: number,
  noiseThreshold?: string,
  keepPadding?: number
): Promise<any> {
  const res = await fetch(`${API_BASE}/video/silence-detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, minDuration, noiseThreshold, keepPadding }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Silence detection failed.');
  }
  return json.data;
}

/**
 * Fetch royalty-free music presets
 */
export async function getMusicPresetsApi(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/video/music/presets`, { cache: 'no-store' });
    const json = await res.json();
    if (res.ok && json.success) {
      return json.data || [];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Upload custom background music track
 */
export async function uploadMusicApi(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('music', file);

  const res = await fetch(`${API_BASE}/video/music/upload`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Music upload failed.');
  }
  return json.data;
}

/**
 * Full multi-track video render (cuts, silence, zooms, transitions, music, speed, aspect ratio, captions)
 */
export async function renderVideoEditsApi(projectId: string, payload: any): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/video/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      ...payload,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Video rendering failed.');
  }
  return json.data;
}

/**
 * Poll multi-track video render status
 */
export async function getRenderStatusApi(jobId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/video/render/status/${jobId}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch render status.');
  }
  return json.data;
}

