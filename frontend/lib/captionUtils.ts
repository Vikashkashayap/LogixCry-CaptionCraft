import { Caption, CaptionStyleKey, EditorState, PositionKey } from '../types/editor';
import { CaptionItem } from '../types';

// ─── Time Formatting ─────────────────────────────────────────────────────────

/**
 * Converts seconds (float) to a human-readable time string: MM:SS.cc
 * Example: 65.35 → "01:05.35"
 */
export function secondsToTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) seconds = 0;
  const totalMs = Math.round(seconds * 100);
  const cs = totalMs % 100;
  const totalSec = Math.floor(totalMs / 100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Converts a time string (MM:SS.cc or MM:SS or plain seconds) back to seconds.
 * Returns NaN if the string is invalid.
 */
export function timeToSeconds(str: string): number {
  str = str.trim();
  // Plain number
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  // MM:SS or MM:SS.cc
  const match = str.match(/^(\d+):(\d{2})(?:\.(\d+))?$/);
  if (!match) return NaN;
  const m = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const cs = match[3] ? parseFloat('0.' + match[3].padEnd(2, '0').slice(0, 2)) : 0;
  return m * 60 + s + cs;
}

// ─── Caption Normalization ────────────────────────────────────────────────────

let _captionCounter = 0;

/**
 * Generate a unique caption ID.
 */
export function generateCaptionId(): string {
  return `caption-${Date.now()}-${++_captionCounter}`;
}

/**
 * Adapts raw CaptionItem[] (from Gemini/backend, no id) into editor Caption[].
 * Adds unique IDs to each caption for stable React keying.
 */
export function normalizeCaptions(items: CaptionItem[]): Caption[] {
  return items.map((item) => ({
    id: generateCaptionId(),
    start: Number(item.start) || 0,
    end: Number(item.end) || 0,
    text: item.text?.trim() || '',
  }));
}

/**
 * Strip editor-only fields back to plain CaptionItem for API requests.
 */
export function captionsToApi(captions: Caption[]): CaptionItem[] {
  return captions.map(({ start, end, text }) => ({ start, end, text }));
}

// ─── Caption Validation ───────────────────────────────────────────────────────

export interface ValidationError {
  captionIndex: number;
  captionId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validates captions for rendering. Returns detailed, user-friendly errors.
 */
export function validateCaptions(captions: Caption[], videoDuration?: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  if (!captions || captions.length === 0) {
    return {
      valid: false,
      errors: [{ captionIndex: -1, captionId: '', message: 'No captions to render.' }],
      warnings: [],
    };
  }

  for (let i = 0; i < captions.length; i++) {
    const cap = captions[i];
    const label = `Caption ${i + 1}`;

    // Check for duplicate IDs
    if (ids.has(cap.id)) {
      errors.push({ captionIndex: i, captionId: cap.id, message: `${label} has a duplicate ID.` });
    }
    ids.add(cap.id);

    // Text validation
    if (!cap.text || cap.text.trim() === '') {
      errors.push({ captionIndex: i, captionId: cap.id, message: `${label} has empty text.` });
    }

    // Numeric checks
    if (isNaN(cap.start) || !isFinite(cap.start)) {
      errors.push({ captionIndex: i, captionId: cap.id, message: `${label} has an invalid start time.` });
      continue;
    }
    if (isNaN(cap.end) || !isFinite(cap.end)) {
      errors.push({ captionIndex: i, captionId: cap.id, message: `${label} has an invalid end time.` });
      continue;
    }

    // Negative time
    if (cap.start < 0) {
      errors.push({ captionIndex: i, captionId: cap.id, message: `${label} starts before time 0 (${secondsToTime(cap.start)}).` });
    }

    // End before start
    if (cap.end <= cap.start) {
      errors.push({ captionIndex: i, captionId: cap.id, message: `${label} ends before it starts (${secondsToTime(cap.start)} → ${secondsToTime(cap.end)}).` });
    }

    // Duration check
    if (videoDuration && videoDuration > 0) {
      if (cap.end > videoDuration + 1) {
        warnings.push(`${label} extends beyond video duration.`);
      }
    }

    // Overlap check
    if (i > 0) {
      const prev = captions[i - 1];
      if (cap.start < prev.end - 0.05) {
        errors.push({
          captionIndex: i,
          captionId: cap.id,
          message: `Caption ${i + 1} overlaps with Caption ${i} (starts at ${secondsToTime(cap.start)}, previous ends at ${secondsToTime(prev.end)}).`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Utility: Get active caption at current time ──────────────────────────────

export function getActiveCaptionIndex(captions: Caption[], currentTime: number): number {
  for (let i = 0; i < captions.length; i++) {
    const cap = captions[i];
    if (currentTime >= cap.start && currentTime < cap.end) {
      return i;
    }
  }
  return -1;
}

// ─── CSS Preview Helpers ──────────────────────────────────────────────────────

/**
 * Build CSS style object for the caption overlay preview from EditorState.
 * Used in VideoPreview for real-time rendering (no FFmpeg needed).
 */
export function buildOverlayCaptionStyle(state: {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundEnabled: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  outlineEnabled: boolean;
  outlineColor: string;
  outlineWidth: number;
  textAlign: 'left' | 'center' | 'right';
  captionWidth: number;
  position: PositionKey;
}): React.CSSProperties {
  const strokeW = Math.max(1.5, (state.outlineWidth || 3) * 0.7);
  const textShadow = state.outlineEnabled
    ? `
      ${strokeW}px ${strokeW}px 0 ${state.outlineColor},
      -${strokeW}px -${strokeW}px 0 ${state.outlineColor},
      ${strokeW}px -${strokeW}px 0 ${state.outlineColor},
      -${strokeW}px ${strokeW}px 0 ${state.outlineColor},
      0 2px 6px rgba(0,0,0,0.9)
    `
    : '0 2px 6px rgba(0,0,0,0.85)';

  const bgColorWithOpacity = state.backgroundEnabled
    ? hexToRgba(state.backgroundColor || '#000000', (state.backgroundOpacity ?? 60) / 100)
    : 'transparent';

  const positionStyles: React.CSSProperties =
    state.position === 'top'
      ? { top: '12%', bottom: 'auto' }
      : state.position === 'center'
      ? { top: '50%', transform: 'translateX(-50%) translateY(-50%)' }
      : { bottom: '14%', top: 'auto' };

  return {
    position: 'absolute',
    left: '50%',
    transform: state.position === 'center'
      ? 'translateX(-50%) translateY(-50%)'
      : 'translateX(-50%)',
    width: `${state.captionWidth || 80}%`,
    fontFamily: state.fontFamily || 'Arial Black, Arial, sans-serif',
    fontSize: `clamp(15px, calc(${state.fontSize}px * 0.42 + 0.3vw), 36px)`,
    color: state.textColor || '#FFFFFF',
    textAlign: state.textAlign || 'center',
    textShadow,
    backgroundColor: bgColorWithOpacity,
    borderRadius: state.backgroundEnabled ? '6px' : undefined,
    padding: state.backgroundEnabled ? '6px 12px' : '2px 4px',
    lineHeight: 1.25,
    fontWeight: 900,
    letterSpacing: '0.02em',
    wordBreak: 'break-word',
    ...positionStyles,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Add React import for CSSProperties
import type React from 'react';
