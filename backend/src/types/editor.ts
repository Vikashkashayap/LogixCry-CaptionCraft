import { AspectRatio, CaptionItem, CaptionStyle, ExtendedRenderOptions } from './index';

export interface SceneSegment {
  start: number;
  end: number;
  description: string;
}

export interface CutSegment {
  id?: string;
  start: number;
  end: number;
  reason: string;
  accepted?: boolean;
}

export interface SilenceSegment {
  id?: string;
  start: number;
  end: number;
  duration: number;
  accepted?: boolean;
}

export interface HighlightSegment {
  id?: string;
  start: number;
  end: number;
  score: number;
  reason: string;
  accepted?: boolean;
}

export interface ZoomEffect {
  id?: string;
  start: number;
  end: number;
  scale: number; // e.g. 1.05 to 1.25
  reason?: string;
  accepted?: boolean;
}

export type TransitionType = 'cut' | 'fade' | 'crossfade';

export interface TransitionEffect {
  id?: string;
  type: TransitionType;
  time: number; // timestamp where transition occurs
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

export interface MusicConfig {
  trackId?: string;
  trackName?: string;
  customAudioPath?: string;
  volume: number; // 0 to 1 (e.g. 0.1 for 10%)
  originalAudioVolume?: number; // 0 to 1.5 (e.g. 1.0 for 100%)
  muteOriginalAudio?: boolean;
  startTime?: number; // offset in video (seconds)
  trackOffset?: number; // start offset in music file (seconds)
  duration?: number; // duration to play
  fadeIn?: number; // 0 to 5 seconds
  fadeOut?: number; // 0 to 5 seconds
  loop?: boolean;
}

export interface SpeedSegment {
  id?: string;
  start: number;
  end: number;
  speed: number; // 0.75, 1, 1.25, 1.5, 2
}

export interface VideoProject {
  id: string;
  sourceVideoId: string;
  captions: CaptionItem[];
  cuts: CutSegment[];
  silenceSegments: SilenceSegment[];
  highlights: HighlightSegment[];
  zooms: ZoomEffect[];
  transitions: TransitionEffect[];
  music?: MusicConfig;
  speedSegments: SpeedSegment[];
  globalSpeed?: number;
  aspectRatio: AspectRatio;
  aiAnalysis?: VideoEditPlan;
  createdAt: string;
  updatedAt: string;
}

export interface RenderProjectPayload {
  projectId: string;
  captions?: CaptionItem[];
  style?: CaptionStyle;
  extendedOptions?: ExtendedRenderOptions;
  cuts?: CutSegment[];
  silenceSegments?: SilenceSegment[];
  zooms?: ZoomEffect[];
  transitions?: TransitionEffect[];
  music?: MusicConfig;
  speedSegments?: SpeedSegment[];
  globalSpeed?: number;
  aspectRatio?: AspectRatio;
}
