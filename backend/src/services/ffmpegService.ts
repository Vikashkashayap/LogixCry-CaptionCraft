import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

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
}

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
 * Typically completes in < 0.5s for 1-5 minute videos.
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
      .on('error', (err, stdout, stderr) => {
        console.error('[FFmpeg Audio Extraction Error]:', err.message);
        reject(new Error(`Failed to extract audio track: ${err.message}`));
      })
      .run();
  });
}

/**
 * Burns subtitles (.ass or .srt) into video file using H.264 / AAC MP4 format.
 */
export function burnSubtitles(options: RenderOptions): Promise<string> {
  const { inputVideoPath, subtitlePath, outputVideoPath, onProgress } = options;

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputVideoPath)) {
      return reject(new Error(`Input video file not found: ${inputVideoPath}`));
    }
    if (!fs.existsSync(subtitlePath)) {
      return reject(new Error(`Subtitle file not found: ${subtitlePath}`));
    }

    const escapedSubPath = escapeFFmpegFilterPath(subtitlePath);
    const subtitleFilter = `subtitles=${escapedSubPath}`;

    console.log(`[FFmpeg] Starting video rendering...`);
    console.log(`[FFmpeg] Input: ${inputVideoPath}`);
    console.log(`[FFmpeg] Subtitles filter: ${subtitleFilter}`);
    console.log(`[FFmpeg] Output: ${outputVideoPath}`);

    ffmpeg(inputVideoPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        `-vf ${subtitleFilter}`,
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
      .on('error', (err, stdout, stderr) => {
        console.error('[FFmpeg Error]:', err.message);
        console.error('[FFmpeg Stderr]:', stderr);
        reject(new Error(`FFmpeg caption rendering failed: ${err.message}`));
      })
      .run();
  });
}
