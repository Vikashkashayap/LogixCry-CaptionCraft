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

export type CaptionStyle = 'classic' | 'bold' | 'minimal' | 'highlight' | 'cyber' | 'reels' | 'youtube' | 'karaoke';
export type LanguageOption = 'auto' | 'English' | 'Hindi' | 'Hinglish';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
export type CaptionPosition = 'top' | 'center' | 'bottom';

/** Extended render parameters from the editor */
export interface ExtendedRenderOptions {
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;          // hex e.g. '#FFFFFF'
  backgroundEnabled?: boolean;
  backgroundColor?: string;    // hex
  backgroundOpacity?: number;  // 0-100
  outlineEnabled?: boolean;
  outlineColor?: string;       // hex
  outlineWidth?: number;
  position?: CaptionPosition;
  captionWidth?: number;       // 20-100 (percent)
  textAlign?: 'left' | 'center' | 'right';
  aspectRatio?: AspectRatio;
}

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

export * from './editor';

