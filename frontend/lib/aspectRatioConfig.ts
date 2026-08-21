import { AspectRatioKey } from '../types/editor';

export interface AspectRatioConfig {
  id: AspectRatioKey;
  label: string;
  name: string;
  sub: string;
  width: number;
  height: number;
  cssRatio: string;
  fraction: number; // width / height
  platformLabel: string;
  recommendedCaptionSize: number; // in px
  safeArea: {
    top: number; // percentage
    bottom: number; // percentage
    left: number; // percentage
    right: number; // percentage
  };
}

export const ASPECT_RATIO_CONFIGS: Record<AspectRatioKey, AspectRatioConfig> = {
  '16:9': {
    id: '16:9',
    label: '16:9',
    name: 'Landscape / YouTube',
    sub: 'YouTube & Landscape',
    width: 1920,
    height: 1080,
    cssRatio: '16 / 9',
    fraction: 16 / 9,
    platformLabel: 'YouTube',
    recommendedCaptionSize: 48,
    safeArea: { top: 5, bottom: 10, left: 10, right: 10 },
  },
  '9:16': {
    id: '9:16',
    label: '9:16',
    name: 'Vertical / Reels & Shorts',
    sub: 'Reels, Shorts, TikTok',
    width: 1080,
    height: 1920,
    cssRatio: '9 / 16',
    fraction: 9 / 16,
    platformLabel: 'Reels / Shorts / TikTok',
    recommendedCaptionSize: 52,
    safeArea: { top: 15, bottom: 20, left: 8, right: 8 },
  },
  '1:1': {
    id: '1:1',
    label: '1:1',
    name: 'Square / Post',
    sub: 'Square Posts',
    width: 1080,
    height: 1080,
    cssRatio: '1 / 1',
    fraction: 1 / 1,
    platformLabel: 'Square Feed',
    recommendedCaptionSize: 46,
    safeArea: { top: 8, bottom: 12, left: 8, right: 8 },
  },
  '4:5': {
    id: '4:5',
    label: '4:5',
    name: 'Portrait / Instagram Feed',
    sub: 'Instagram Portrait Feed',
    width: 1080,
    height: 1350,
    cssRatio: '4 / 5',
    fraction: 4 / 5,
    platformLabel: 'IG Portrait',
    recommendedCaptionSize: 48,
    safeArea: { top: 10, bottom: 15, left: 8, right: 8 },
  },
};

export const ASPECT_RATIO_LIST: AspectRatioConfig[] = Object.values(ASPECT_RATIO_CONFIGS);
