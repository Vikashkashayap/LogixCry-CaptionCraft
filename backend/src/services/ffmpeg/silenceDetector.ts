import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { SilenceSegment } from '../../types/editor';

export interface SilenceDetectionOptions {
  minDuration?: number; // default 0.6 seconds
  noiseThreshold?: string; // default '-30dB'
  keepPadding?: number; // default 0.15 seconds
  videoDuration?: number;
}

/**
 * Runs FFmpeg silencedetect audio filter to identify silent segments.
 */
export function detectSilence(
  inputVideoPath: string,
  options: SilenceDetectionOptions = {}
): Promise<SilenceSegment[]> {
  const {
    minDuration = 0.6,
    noiseThreshold = '-30dB',
    keepPadding = 0.15,
    videoDuration = 0,
  } = options;

  return new Promise((resolve, reject) => {
    const rawSegments: Array<{ start: number; end: number }> = [];
    let currentStart: number | null = null;

    ffmpeg(inputVideoPath)
      .noVideo()
      .audioFilters([`silencedetect=noise=${noiseThreshold}:d=${minDuration}`])
      .format('null')
      .output('-')
      .on('stderr', (stderrLine: string) => {
        // Parse silence_start
        const startMatch = stderrLine.match(/silence_start:\s*([0-9.]+)/);
        if (startMatch && startMatch[1]) {
          currentStart = parseFloat(startMatch[1]);
        }

        // Parse silence_end
        const endMatch = stderrLine.match(/silence_end:\s*([0-9.]+)/);
        if (endMatch && endMatch[1] && currentStart !== null) {
          const rawEnd = parseFloat(endMatch[1]);
          rawSegments.push({
            start: currentStart,
            end: rawEnd,
          });
          currentStart = null;
        }
      })
      .on('end', () => {
        // If file ended while in silence
        if (currentStart !== null && videoDuration > currentStart) {
          rawSegments.push({
            start: currentStart,
            end: videoDuration,
          });
        }

        // Apply padding and format segments
        const results: SilenceSegment[] = [];
        for (const seg of rawSegments) {
          const paddedStart = seg.start + keepPadding;
          const paddedEnd = seg.end - keepPadding;
          const dur = paddedEnd - paddedStart;

          if (paddedEnd > paddedStart && dur >= 0.2) {
            results.push({
              id: uuidv4(),
              start: parseFloat(paddedStart.toFixed(2)),
              end: parseFloat(paddedEnd.toFixed(2)),
              duration: parseFloat(dur.toFixed(2)),
              accepted: false,
            });
          }
        }

        console.log(`[SilenceDetector] Detected ${results.length} silence segments in ${inputVideoPath}`);
        resolve(results);
      })
      .on('error', (err) => {
        console.error('[SilenceDetector Error]:', err.message);
        reject(new Error(`Silence detection failed: ${err.message}`));
      })
      .run();
  });
}
