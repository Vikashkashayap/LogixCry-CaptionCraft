import { ApiResponse, CaptionItem, CaptionStyle, JobHistoryItem, JobStatusResponse, LanguageOption } from '../types';

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
 * Request re-rendering with modified captions or new style
 */
export async function rerenderCaptionsApi(
  jobId: string,
  captions: CaptionItem[],
  captionStyle?: CaptionStyle
): Promise<void> {
  const res = await fetch(`${API_BASE}/captions/rerender/${jobId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
