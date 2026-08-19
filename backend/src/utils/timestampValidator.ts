import { CaptionItem, GeminiCaptionResponse } from '../types';

export class TimestampValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'TimestampValidationError';
  }
}

/**
 * Validates, cleans, and normalizes Gemini caption data.
 */
export function validateAndSanitizeCaptions(
  rawResponse: any,
  videoDurationSeconds?: number
): GeminiCaptionResponse {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new TimestampValidationError('Invalid response object received from AI transcription.');
  }

  const language = typeof rawResponse.language === 'string' && rawResponse.language.trim()
    ? rawResponse.language.trim()
    : 'auto';

  const duration = typeof rawResponse.duration === 'number' && !isNaN(rawResponse.duration) && rawResponse.duration > 0
    ? rawResponse.duration
    : videoDurationSeconds || 0;

  const rawCaptions = rawResponse.captions;
  // If no speech/captions were detected in audio (e.g. music/ambient only)
  if (!Array.isArray(rawCaptions) || rawCaptions.length === 0) {
    return {
      language,
      duration: Number(duration.toFixed(2)),
      captions: [],
    };
  }

  const validItems: CaptionItem[] = [];

  for (let i = 0; i < rawCaptions.length; i++) {
    const item = rawCaptions[i];
    if (!item || typeof item !== 'object') continue;

    let start = Number(item.start);
    let end = Number(item.end);
    let text = typeof item.text === 'string' ? item.text.trim() : '';

    // Filter invalid numbers or empty strings
    if (isNaN(start) || isNaN(end) || !isFinite(start) || !isFinite(end) || !text) {
      continue;
    }

    // Ensure start is not negative
    start = Math.max(0, start);

    // If start >= end, attempt micro-repair if end is missing slightly
    if (end <= start) {
      // Estimate 0.5s per 3 words minimum
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = Math.max(1.5, wordCount * 0.4);
      end = start + estimatedDuration;
    }

    // Limit maximum duration per single caption (e.g. max 12 seconds)
    if (end - start > 12) {
      end = start + 12;
    }

    // Normalize spaces
    text = text.replace(/\s+/g, ' ');

    validItems.push({
      start: Number(start.toFixed(3)),
      end: Number(end.toFixed(3)),
      text,
    });
  }

  // If items were provided but none were valid text
  if (validItems.length === 0) {
    return {
      language,
      duration: Number(duration.toFixed(2)),
      captions: [],
    };
  }

  // Sort strictly by start time
  validItems.sort((a, b) => a.start - b.start);

  // Fix overlaps and enforce monotonicity
  for (let i = 1; i < validItems.length; i++) {
    const prev = validItems[i - 1];
    const curr = validItems[i];

    // If current start is earlier than previous end, adjust
    if (curr.start < prev.end) {
      // If overlap is tiny (< 0.5s), move current start forward to match prev end
      if (prev.end - curr.start <= 0.5 && curr.end > prev.end + 0.3) {
        curr.start = prev.end;
      } else {
        // Adjust previous end to current start
        prev.end = Math.max(prev.start + 0.5, curr.start);
      }
    }

    // Double check bounds after fix
    if (curr.end <= curr.start) {
      curr.end = Number((curr.start + 1.0).toFixed(3));
    }
  }

  // Bound check against duration if duration is known
  const maxDuration = videoDurationSeconds && videoDurationSeconds > 0 ? videoDurationSeconds : duration;
  if (maxDuration > 0) {
    for (const item of validItems) {
      if (item.start >= maxDuration) {
        item.start = Math.max(0, maxDuration - 1.0);
      }
      if (item.end > maxDuration + 1.0) { // small tolerance
        item.end = maxDuration;
      }
    }
  }

  return {
    language,
    duration: Number(duration.toFixed(2)),
    captions: validItems,
  };
}
