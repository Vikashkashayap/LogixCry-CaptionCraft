import { v4 as uuidv4 } from 'uuid';
import {
  CutSegment,
  HighlightSegment,
  HookSuggestion,
  SceneSegment,
  TransitionEffect,
  VideoEditPlan,
  ZoomEffect,
} from '../types/editor';

export interface ValidationResult {
  valid: boolean;
  plan: VideoEditPlan;
  errors: string[];
  repaired: boolean;
}

function isFiniteNumber(val: any): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Validates and repairs Gemini Video Edit Plan with 1-pass controlled auto-repair.
 */
export function validateEditPlan(raw: any, videoDuration: number): ValidationResult {
  const errors: string[] = [];
  let repaired = false;

  const duration = isFiniteNumber(raw?.duration) && raw.duration > 0
    ? raw.duration
    : videoDuration > 0
      ? videoDuration
      : 60.0;

  // 1. Scenes
  const rawScenes = Array.isArray(raw?.scenes) ? raw.scenes : [];
  const scenes: SceneSegment[] = [];

  for (const s of rawScenes) {
    if (!s || typeof s !== 'object') continue;
    let start = isFiniteNumber(s.start) ? s.start : 0;
    let end = isFiniteNumber(s.end) ? s.end : 0;
    let description = typeof s.description === 'string' ? s.description.trim() : 'Scene';

    if (start < 0 || end > duration || end <= start) {
      repaired = true;
      start = clamp(start, 0, duration);
      end = clamp(end, start + 0.1, duration);
    }

    if (end > start) {
      scenes.push({
        start: parseFloat(start.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        description: description || 'Scene',
      });
    }
  }

  // 2. Suggested Cuts
  const rawCuts = Array.isArray(raw?.suggestedCuts) ? raw.suggestedCuts : [];
  const suggestedCuts: CutSegment[] = [];

  for (const c of rawCuts) {
    if (!c || typeof c !== 'object') continue;
    let start = isFiniteNumber(c.start) ? c.start : 0;
    let end = isFiniteNumber(c.end) ? c.end : 0;
    let reason = typeof c.reason === 'string' ? c.reason.trim() : 'Suggested cut';

    if (start < 0 || end > duration || end <= start) {
      repaired = true;
      start = clamp(start, 0, duration);
      end = clamp(end, start + 0.2, duration);
    }

    if (end > start && end - start >= 0.2) {
      suggestedCuts.push({
        id: c.id || uuidv4(),
        start: parseFloat(start.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        reason: reason || 'Suggested cut',
        accepted: c.accepted === true,
      });
    }
  }

  // 3. Highlights
  const rawHighlights = Array.isArray(raw?.highlights) ? raw.highlights : [];
  const highlights: HighlightSegment[] = [];

  for (const h of rawHighlights) {
    if (!h || typeof h !== 'object') continue;
    let start = isFiniteNumber(h.start) ? h.start : 0;
    let end = isFiniteNumber(h.end) ? h.end : 0;
    let score = isFiniteNumber(h.score) ? clamp(h.score, 0.1, 1.0) : 0.85;
    let reason = typeof h.reason === 'string' ? h.reason.trim() : 'Key highlight';

    if (start < 0 || end > duration || end <= start) {
      repaired = true;
      start = clamp(start, 0, duration);
      end = clamp(end, start + 0.5, duration);
    }

    if (end > start) {
      highlights.push({
        id: h.id || uuidv4(),
        start: parseFloat(start.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        score: parseFloat(score.toFixed(2)),
        reason: reason || 'Key moment',
        accepted: h.accepted === true,
      });
    }
  }

  // 4. Zooms (Safe range 1.05 to 1.25, default 1.10)
  const rawZooms = Array.isArray(raw?.zooms) ? raw.zooms : [];
  const zooms: ZoomEffect[] = [];

  for (const z of rawZooms) {
    if (!z || typeof z !== 'object') continue;
    let start = isFiniteNumber(z.start) ? z.start : 0;
    let end = isFiniteNumber(z.end) ? z.end : 0;
    let scale = isFiniteNumber(z.scale) ? clamp(z.scale, 1.05, 1.25) : 1.10;
    let reason = typeof z.reason === 'string' ? z.reason.trim() : 'Key emphasis';

    if (start < 0 || end > duration || end <= start) {
      repaired = true;
      start = clamp(start, 0, duration);
      end = clamp(end, start + 0.5, duration);
    }

    if (end > start) {
      zooms.push({
        id: z.id || uuidv4(),
        start: parseFloat(start.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        scale: parseFloat(scale.toFixed(2)),
        reason: reason || 'Visual zoom',
        accepted: z.accepted === true,
      });
    }
  }

  // 5. Transitions
  const rawTransitions = Array.isArray(raw?.transitions) ? raw.transitions : [];
  const transitions: TransitionEffect[] = [];

  for (const t of rawTransitions) {
    if (!t || typeof t !== 'object') continue;
    let type: 'cut' | 'fade' | 'crossfade' =
      t.type === 'fade' || t.type === 'crossfade' ? t.type : 'cut';
    let time = isFiniteNumber(t.time) ? clamp(t.time, 0, duration) : 0;
    let transDuration = isFiniteNumber(t.duration) ? clamp(t.duration, 0.1, 1.5) : 0.3;
    let reason = typeof t.reason === 'string' ? t.reason.trim() : 'Scene transition';

    transitions.push({
      id: t.id || uuidv4(),
      type,
      time: parseFloat(time.toFixed(2)),
      duration: parseFloat(transDuration.toFixed(2)),
      reason,
      accepted: t.accepted === true,
    });
  }

  // 6. Hook
  let hook: HookSuggestion | undefined;
  if (raw?.hook && typeof raw.hook === 'object') {
    let start = isFiniteNumber(raw.hook.start) ? clamp(raw.hook.start, 0, duration) : 0;
    let end = isFiniteNumber(raw.hook.end) ? clamp(raw.hook.end, start + 0.5, duration) : Math.min(10, duration);
    let score = isFiniteNumber(raw.hook.score) ? clamp(raw.hook.score, 0.1, 1.0) : 0.9;
    let reason = typeof raw.hook.reason === 'string' ? raw.hook.reason.trim() : 'Strong opening statement';

    if (end > start) {
      hook = {
        start: parseFloat(start.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        score: parseFloat(score.toFixed(2)),
        reason: reason || 'Strong hook',
      };
    }
  }

  // 7. Recommendations
  const rawRecs = Array.isArray(raw?.recommendations) ? raw.recommendations : [];
  const recommendations: string[] = rawRecs
    .filter((r: any) => typeof r === 'string' && r.trim().length > 0)
    .map((r: string) => r.trim());

  if (recommendations.length === 0) {
    recommendations.push('Apply AI cuts and silence removal for improved pacing.');
  }

  const sanitizedPlan: VideoEditPlan = {
    duration: parseFloat(duration.toFixed(2)),
    scenes,
    suggestedCuts,
    highlights,
    zooms,
    transitions,
    hook,
    recommendations,
  };

  return {
    valid: true,
    plan: sanitizedPlan,
    errors,
    repaired,
  };
}
