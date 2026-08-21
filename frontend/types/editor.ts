/**
 * Editor Types — Central type definitions for the Video Editor & Caption Editor
 */

// ─── Caption (with unique ID for editor tracking) ───────────────────────────

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface Caption {
  id: string;
  start: number; // seconds (float)
  end: number;   // seconds (float)
  text: string;
  words?: CaptionWord[]; // future word-level timestamps
}

// ─── Style & Format Keys ────────────────────────────────────────────────────

export type CaptionStyleKey =
  | 'classic'
  | 'bold'
  | 'youtube'
  | 'minimal'
  | 'reels'
  | 'karaoke'
  | 'highlight'
  | 'cyber';

export type AspectRatioKey = '16:9' | '9:16' | '1:1' | '4:5';

export type PositionKey = 'top' | 'center' | 'bottom';

// ─── AI Video Analysis & Editing Elements ───────────────────────────────────

export interface SceneSegment {
  start: number;
  end: number;
  description: string;
}

export interface CutSegment {
  id: string;
  start: number;
  end: number;
  reason: string;
  accepted?: boolean;
}

export interface SilenceSegment {
  id: string;
  start: number;
  end: number;
  duration: number;
  accepted?: boolean;
}

export interface HighlightSegment {
  id: string;
  start: number;
  end: number;
  score: number;
  reason: string;
  accepted?: boolean;
}

export interface ZoomEffect {
  id: string;
  start: number;
  end: number;
  scale: number; // 1.05 to 1.25
  reason?: string;
  accepted?: boolean;
}

export type TransitionType = 'cut' | 'fade' | 'crossfade';

export interface TransitionEffect {
  id: string;
  type: TransitionType;
  time: number; // seconds
  duration: number; // e.g. 0.3s
  reason?: string;
  accepted?: boolean;
}

export interface HookSuggestion {
  start: number;
  end: number;
  score: number;
  reason: string;
}

export interface VideoEditPlan {
  duration: number;
  scenes: SceneSegment[];
  suggestedCuts: CutSegment[];
  highlights: HighlightSegment[];
  zooms: ZoomEffect[];
  transitions: TransitionEffect[];
  hook?: HookSuggestion;
  recommendations: string[];
}

// ─── Background Music & Audio Mixing ────────────────────────────────────────

export interface MusicConfig {
  trackId?: string;
  trackName?: string;
  customAudioPath?: string;
  customAudioUrl?: string;
  volume: number; // 0.0 to 1.0
  originalAudioVolume?: number; // 0.0 to 1.5
  muteOriginalAudio?: boolean;
  startTime?: number; // offset in video
  fadeIn?: number; // 0-5s
  fadeOut?: number; // 0-5s
  loop?: boolean;
}

export interface SpeedSegment {
  id: string;
  start: number;
  end: number;
  speed: number; // 0.75, 1, 1.25, 1.5, 2
}

// ─── Complete Video Project State (Non-Destructive) ─────────────────────────

export interface VideoProject {
  id: string;
  sourceVideoId: string;
  captions: Caption[];
  cuts: CutSegment[];
  silenceSegments: SilenceSegment[];
  highlights: HighlightSegment[];
  zooms: ZoomEffect[];
  transitions: TransitionEffect[];
  music?: MusicConfig;
  speedSegments: SpeedSegment[];
  globalSpeed: number;
  aspectRatio: AspectRatioKey;
  aiAnalysis?: VideoEditPlan;
  createdAt: string;
  updatedAt: string;
}

// ─── Editor State (Single Source of Truth) ───────────────────────────────────

export interface EditorState {
  captions: Caption[];

  // Style preset
  style: CaptionStyleKey;

  // Font
  fontFamily: string;
  fontSize: number; // px

  // Colors
  textColor: string; // hex

  // Background box
  backgroundEnabled: boolean;
  backgroundColor: string; // hex
  backgroundOpacity: number; // 0-100

  // Outline/stroke
  outlineEnabled: boolean;
  outlineColor: string; // hex
  outlineWidth: number; // px

  // Layout
  position: PositionKey;
  captionWidth: number; // 20-100 (percent)
  textAlign: 'left' | 'center' | 'right';

  // Output format
  aspectRatio: AspectRatioKey;

  // Video Edits
  cuts: CutSegment[];
  silenceSegments: SilenceSegment[];
  highlights: HighlightSegment[];
  zooms: ZoomEffect[];
  transitions: TransitionEffect[];
  music?: MusicConfig;
  speedSegments: SpeedSegment[];
  globalSpeed: number;
  aiAnalysis?: VideoEditPlan;
}

// ─── Default Editor State ────────────────────────────────────────────────────

export const DEFAULT_EDITOR_STATE: Omit<EditorState, 'captions'> = {
  style: 'classic',
  fontFamily: 'Arial',
  fontSize: 48,
  textColor: '#FFFFFF',
  backgroundEnabled: false,
  backgroundColor: '#000000',
  backgroundOpacity: 60,
  outlineEnabled: true,
  outlineColor: '#000000',
  outlineWidth: 3,
  position: 'bottom',
  captionWidth: 80,
  textAlign: 'center',
  aspectRatio: '16:9',
  cuts: [],
  silenceSegments: [],
  highlights: [],
  zooms: [],
  transitions: [],
  speedSegments: [],
  globalSpeed: 1.0,
};

// ─── Aspect Ratio Dimensions ─────────────────────────────────────────────────

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatioKey, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1':  { width: 1080, height: 1080 },
  '4:5':  { width: 1080, height: 1350 },
};

// ─── Safe Font List ──────────────────────────────────────────────────────────

export const SAFE_FONTS: { label: string; value: string }[] = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Arial Black', value: 'Arial Black' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Tahoma', value: 'Tahoma' },
];

// ─── Render Request Payload ──────────────────────────────────────────────────

export interface RenderPayload {
  captions: Array<{ start: number; end: number; text: string }>;
  style: CaptionStyleKey;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundEnabled: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  outlineEnabled: boolean;
  outlineColor: string;
  outlineWidth: number;
  position: PositionKey;
  captionWidth: number;
  textAlign: string;
  aspectRatio: AspectRatioKey;
  cuts?: CutSegment[];
  silenceSegments?: SilenceSegment[];
  zooms?: ZoomEffect[];
  transitions?: TransitionEffect[];
  music?: MusicConfig;
  speedSegments?: SpeedSegment[];
  globalSpeed?: number;
}
