export interface CaptionItem {
  start: number;
  end: number;
  text: string;
}

export type CaptionStyle = 'classic' | 'bold' | 'minimal' | 'highlight' | 'cyber' | 'reels';
export type LanguageOption = 'auto' | 'English' | 'Hindi' | 'Hinglish';

export type JobStatus =
  | 'uploading'
  | 'sending_to_ai'
  | 'analyzing'
  | 'generating_captions'
  | 'rendering'
  | 'completed'
  | 'failed';

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  message: string;
  duration?: number;
  language?: LanguageOption;
  style?: CaptionStyle;
  captions?: CaptionItem[];
  previewUrl?: string | null;
  downloadUrl?: string | null;
  error?: string | null;
}

export interface JobHistoryItem {
  jobId: string;
  originalName: string;
  status: JobStatus;
  progress: number;
  language: LanguageOption;
  style: CaptionStyle;
  duration?: number;
  createdAt: string;
  previewUrl?: string | null;
  downloadUrl?: string | null;
  captionsCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
