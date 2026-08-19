export interface CaptionItem {
  start: number;
  end: number;
  text: string;
}

export interface GeminiCaptionResponse {
  language: string;
  duration: number;
  captions: CaptionItem[];
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

export interface CaptionJob {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  inputPath: string;
  filename: string;
  originalName: string;
  mimeType: string;
  language: LanguageOption;
  style: CaptionStyle;
  duration?: number;
  captions?: CaptionItem[];
  assPath?: string;
  srtPath?: string;
  outputPath?: string;
  previewUrl?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
