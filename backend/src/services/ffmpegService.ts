import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { AspectRatio } from '../types';

// Configure ffmpeg and ffprobe paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
  console.log(`[FFmpeg] Using ffmpeg-static at: ${ffmpegStatic}`);
} else {
  console.log('[FFmpeg] ffmpeg-static not found, using system ffmpeg');
}

if (ffprobeStatic && ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
  console.log(`[FFprobe] Using ffprobe-static at: ${ffprobeStatic.path}`);
} else {
  console.log('[FFprobe] Using system ffprobe');
}

export interface RenderOptions {
  inputVideoPath: string;
  subtitlePath: string; // .ass or .srt
  outputVideoPath: string;
  onProgress?: (percent: number) => void;
  aspectRatio?: AspectRatio; // '16:9' | '9:16' | '1:1'
}

// Target output dimensions per aspect ratio
export const ASPECT_RATIO_DIMS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1':  { width: 1080, height: 1080 },
  '4:5':  { width: 1080, height: 1350 },
};

/**
 * Escapes filepath for use inside FFmpeg subtitles filter on Windows and POSIX.
 */
export function escapeFFmpegFilterPath(filePath: string): string {
  const isWindows = process.platform === 'win32';
  let formatted = filePath.replace(/\\/g, '/');
  if (isWindows) {
    // Escape colon after drive letter: D: -> D\\:
    formatted = formatted.replace(/^([a-zA-Z]):/, '$1\\:');
  }
  // Escape single quotes if any
  formatted = formatted.replace(/'/g, "'\\''");
  return `'${formatted}'`;
}

/**
 * Extract video metadata (duration in seconds)
 */
export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata || !metadata.format || !metadata.format.duration) {
        console.warn(`[FFmpeg] Unable to probe duration for ${filePath}:`, err?.message || 'No metadata');
        return resolve(0);
      }
      resolve(metadata.format.duration);
    });
  });
}

/**
 * Extracts optimized, lightweight mono MP3 audio track from video for AI transcription.
 */
export function extractAudio(inputVideoPath: string, outputAudioPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputVideoPath)) {
      return reject(new Error(`Input video file not found: ${inputVideoPath}`));
    }

    console.log(`[FFmpeg] Extracting audio from: ${inputVideoPath} -> ${outputAudioPath}`);

    ffmpeg(inputVideoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate('48k')
      .output(outputAudioPath)
      .on('end', () => {
        console.log(`[FFmpeg] Audio extracted successfully: ${outputAudioPath}`);
        resolve(outputAudioPath);
      })
      .on('error', (err) => {
        console.error('[FFmpeg Audio Extraction Error]:', err.message);
        reject(new Error(`Failed to extract audio track: ${err.message}`));
      })
      .run();
  });
}

/**
 * Build a FFmpeg video filter string that:
 * 1. Scales the video to fill the target aspect ratio (scale-to-cover)
 * 2. Crops the overflow to exactly the target dimensions
 * 3. Burns ASS subtitles on top
 *
 * Strategy: scale2ref + crop (center-crop), preserving visual quality.
 */
function buildVideoFilter(subtitlePath: string, aspectRatio: AspectRatio = '16:9'): string {
  const escapedPath = escapeFFmpegFilterPath(subtitlePath);
  const { width, height } = ASPECT_RATIO_DIMS[aspectRatio];

  if (aspectRatio === '16:9') {
    // No resize needed — standard 1920x1080. Just burn subtitles.
    return `subtitles=${escapedPath}`;
  }

  // For 9:16 or 1:1: scale to cover the target dimensions, then crop center
  // scale: set the larger dimension to target, keeping aspect; then crop to exact target
  const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=increase`;
  const cropFilter = `crop=${width}:${height}`;
  const subtitleFilter = `subtitles=${escapedPath}`;

  return `${scaleFilter},${cropFilter},${subtitleFilter}`;
}

/**
 * Burns subtitles (.ass or .srt) into video file using H.264 / AAC MP4 format.
 * Supports aspect ratio transformation (scale-to-cover + center-crop).
 */
export function burnSubtitles(options: RenderOptions): Promise<string> {
  const { inputVideoPath, subtitlePath, outputVideoPath, onProgress, aspectRatio = '16:9' } = options;

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputVideoPath)) {
      return reject(new Error(`Input video file not found: ${inputVideoPath}`));
    }
    if (!fs.existsSync(subtitlePath)) {
      return reject(new Error(`Subtitle file not found: ${subtitlePath}`));
    }

    const videoFilter = buildVideoFilter(subtitlePath, aspectRatio);

    console.log(`[FFmpeg] Starting video rendering...`);
    console.log(`[FFmpeg] Input: ${inputVideoPath}`);
    console.log(`[FFmpeg] Aspect Ratio: ${aspectRatio} → ${JSON.stringify(ASPECT_RATIO_DIMS[aspectRatio])}`);
    console.log(`[FFmpeg] Video filter: ${videoFilter}`);
    console.log(`[FFmpeg] Output: ${outputVideoPath}`);

    ffmpeg(inputVideoPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        `-vf ${videoFilter}`,
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .output(outputVideoPath)
      .on('start', (commandLine) => {
        console.log(`[FFmpeg Command]: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress && progress.percent && onProgress) {
          const clamped = Math.min(99, Math.max(0, Math.round(progress.percent)));
          onProgress(clamped);
        }
      })
      .on('end', () => {
        console.log(`[FFmpeg] Rendering complete! Output created: ${outputVideoPath}`);
        resolve(outputVideoPath);
      })
      .on('error', (err, _stdout, stderr) => {
        console.error('[FFmpeg Error]:', err.message);
        console.error('[FFmpeg Stderr]:', stderr);
        reject(new Error(`FFmpeg caption rendering failed: ${err.message}`));
      })
      .run();
  });
}
