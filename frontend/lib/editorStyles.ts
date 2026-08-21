import { CaptionStyleKey } from '../types/editor';

/**
 * Central style configuration for all caption presets.
 * Used by both the style selector UI and the overlay preview.
 * The backend ASS style generation reads its own copy in subtitleFormatter.ts.
 */

export interface StyleConfig {
  key: CaptionStyleKey;
  label: string;
  badge: string;
  description: string;
  emoji: string;
  // Preview CSS properties for the style cards
  previewTextColor: string;
  previewFontFamily: string;
  previewFontWeight: string;
  previewTextShadow: string;
  previewLetterSpacing: string;
  previewTextTransform: string;
  tagClassName: string; // Tailwind badge color classes
  // Default editor state overrides applied when style is selected
  defaults: {
    fontFamily: string;
    fontSize: number;
    textColor: string;
    backgroundEnabled: boolean;
    backgroundColor: string;
    backgroundOpacity: number;
    outlineEnabled: boolean;
    outlineColor: string;
    outlineWidth: number;
    position: 'top' | 'center' | 'bottom';
    textAlign: 'left' | 'center' | 'right';
  };
}

export const CAPTION_STYLES: StyleConfig[] = [
  {
    key: 'classic',
    label: 'Classic Cinema',
    badge: 'Standard',
    description: 'White text with black outline. Clean and readable for YouTube & vlogs.',
    emoji: '🎬',
    previewTextColor: '#FFFFFF',
    previewFontFamily: 'Arial',
    previewFontWeight: '700',
    previewTextShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
    previewLetterSpacing: 'normal',
    previewTextTransform: 'none',
    tagClassName: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    defaults: {
      fontFamily: 'Arial',
      fontSize: 48,
      textColor: '#FFFFFF',
      backgroundEnabled: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      outlineEnabled: true,
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      textAlign: 'center',
    },
  },
  {
    key: 'bold',
    label: 'Bold Social',
    badge: 'Viral',
    description: 'Large bold yellow text with heavy stroke. Designed for TikTok & Reels.',
    emoji: '🔥',
    previewTextColor: '#FFE600',
    previewFontFamily: 'Arial Black',
    previewFontWeight: '900',
    previewTextShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000',
    previewLetterSpacing: '0.05em',
    previewTextTransform: 'uppercase',
    tagClassName: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    defaults: {
      fontFamily: 'Arial Black',
      fontSize: 60,
      textColor: '#FFE600',
      backgroundEnabled: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      outlineEnabled: true,
      outlineColor: '#000000',
      outlineWidth: 5,
      position: 'bottom',
      textAlign: 'center',
    },
  },
  {
    key: 'youtube',
    label: 'YouTube',
    badge: 'Professional',
    description: 'Professional readable captions. Medium size, semi-transparent background.',
    emoji: '▶️',
    previewTextColor: '#FFFFFF',
    previewFontFamily: 'Arial',
    previewFontWeight: '600',
    previewTextShadow: '1px 1px 2px rgba(0,0,0,0.9)',
    previewLetterSpacing: 'normal',
    previewTextTransform: 'none',
    tagClassName: 'bg-red-500/10 text-red-300 border-red-500/30',
    defaults: {
      fontFamily: 'Arial',
      fontSize: 40,
      textColor: '#FFFFFF',
      backgroundEnabled: true,
      backgroundColor: '#000000',
      backgroundOpacity: 70,
      outlineEnabled: false,
      outlineColor: '#000000',
      outlineWidth: 0,
      position: 'bottom',
      textAlign: 'center',
    },
  },
  {
    key: 'reels',
    label: 'Instagram/Reels',
    badge: 'Dynamic',
    description: 'Large dynamic text with high contrast. Modern appearance for Reels.',
    emoji: '📱',
    previewTextColor: '#00FF66',
    previewFontFamily: 'Impact',
    previewFontWeight: '900',
    previewTextShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
    previewLetterSpacing: '0.08em',
    previewTextTransform: 'uppercase',
    tagClassName: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    defaults: {
      fontFamily: 'Impact',
      fontSize: 58,
      textColor: '#00FF66',
      backgroundEnabled: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      outlineEnabled: true,
      outlineColor: '#000000',
      outlineWidth: 4,
      position: 'center',
      textAlign: 'center',
    },
  },
  {
    key: 'minimal',
    label: 'Minimal',
    badge: 'Clean',
    description: 'Small clean text with subtle shadow. Minimal visual distraction.',
    emoji: '🧊',
    previewTextColor: '#F5F5F5',
    previewFontFamily: 'Arial',
    previewFontWeight: '400',
    previewTextShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    previewLetterSpacing: '-0.01em',
    previewTextTransform: 'none',
    tagClassName: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    defaults: {
      fontFamily: 'Arial',
      fontSize: 36,
      textColor: '#F5F5F5',
      backgroundEnabled: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      outlineEnabled: true,
      outlineColor: '#1E1E1E',
      outlineWidth: 2,
      position: 'bottom',
      textAlign: 'center',
    },
  },
  {
    key: 'karaoke',
    label: 'Karaoke',
    badge: 'Highlight',
    description: 'Caption-level highlight. Full caption highlights when active (word timestamps unavailable).',
    emoji: '🎤',
    previewTextColor: '#FFFF00',
    previewFontFamily: 'Arial Black',
    previewFontWeight: '900',
    previewTextShadow: '2px 2px 0 #000, -2px -2px 0 #000',
    previewLetterSpacing: '0.02em',
    previewTextTransform: 'none',
    tagClassName: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    defaults: {
      fontFamily: 'Arial Black',
      fontSize: 52,
      textColor: '#FFFF00',
      backgroundEnabled: true,
      backgroundColor: '#1A1A1A',
      backgroundOpacity: 80,
      outlineEnabled: true,
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'center',
      textAlign: 'center',
    },
  },
  {
    key: 'highlight',
    label: 'Electric Cyan',
    badge: 'High Contrast',
    description: 'Vivid glowing cyan for maximum visibility.',
    emoji: '⚡',
    previewTextColor: '#00FFFF',
    previewFontFamily: 'Impact',
    previewFontWeight: '900',
    previewTextShadow: '0 0 8px rgba(0,255,255,0.6), 2px 2px 0 #000, -2px -2px 0 #000',
    previewLetterSpacing: '0.08em',
    previewTextTransform: 'uppercase',
    tagClassName: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    defaults: {
      fontFamily: 'Impact',
      fontSize: 56,
      textColor: '#00FFFF',
      backgroundEnabled: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      outlineEnabled: true,
      outlineColor: '#000000',
      outlineWidth: 4,
      position: 'bottom',
      textAlign: 'center',
    },
  },
  {
    key: 'cyber',
    label: 'Cyber Magenta',
    badge: 'Vibrant',
    description: 'Hot neon pink typography for aesthetic & lifestyle content.',
    emoji: '💖',
    previewTextColor: '#FF1493',
    previewFontFamily: 'Arial Black',
    previewFontWeight: '900',
    previewTextShadow: '0 0 8px rgba(255,20,147,0.6), 2px 2px 0 #000, -2px -2px 0 #000',
    previewLetterSpacing: '0.05em',
    previewTextTransform: 'uppercase',
    tagClassName: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    defaults: {
      fontFamily: 'Arial Black',
      fontSize: 54,
      textColor: '#FF1493',
      backgroundEnabled: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      outlineEnabled: true,
      outlineColor: '#000000',
      outlineWidth: 4,
      position: 'bottom',
      textAlign: 'center',
    },
  },
];

export const STYLE_MAP: Record<CaptionStyleKey, StyleConfig> = Object.fromEntries(
  CAPTION_STYLES.map((s) => [s.key, s])
) as Record<CaptionStyleKey, StyleConfig>;
