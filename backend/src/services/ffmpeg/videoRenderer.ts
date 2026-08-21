import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { AspectRatio, CaptionItem, CaptionStyle, ExtendedRenderOptions } from '../../types';
import { CutSegment, MusicConfig, SilenceSegment, SpeedSegment, ZoomEffect, TransitionEffect } from '../../types/editor';
import { ASPECT_RATIO_DIMS, escapeFFmpegFilterPath, getVideoDuration } from '../ffmpegService';
import { captionsToAss, captionsToAssCustom } from '../../utils/subtitleFormatter';
import { validateAndSanitizeCaptions } from '../../utils/timestampValidator';
import { CONFIG } from '../../config';
import { safeDeleteFile } from '../../utils/fileCleanup';

export interface FullRenderPipelineOptions {
  jobId: string;
  inputVideoPath: string;
  outputVideoPath: string;
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
  onProgress?: (percent: number) => void;
}

interface KeepInterval {
  start: number;
  end: number;
}

/**
 * Calculates keep intervals from total duration by subtracting all accepted cuts and silences.
 */
export function calculateKeepIntervals(
  totalDuration: number,
  cuts: CutSegment[] = [],
  silences: SilenceSegment[] = []
): KeepInterval[] {
  // Collect all accepted cut ranges
  const cutRanges: Array<{ start: number; end: number }> = [];

  for (const c of cuts) {
    if (c.accepted && c.end > c.start) {
      cutRanges.push({
        start: Math.max(0, c.start),
        end: Math.min(totalDuration, c.end),
      });
    }
  }

  for (const s of silences) {
    if (s.accepted && s.end > s.start) {
      cutRanges.push({
        start: Math.max(0, s.start),
        end: Math.min(totalDuration, s.end),
      });
    }
  }

  if (cutRanges.length === 0) {
    return [{ start: 0, end: totalDuration }];
  }

  // Sort and merge overlapping cut ranges
  cutRanges.sort((a, b) => a.start - b.start);
  const mergedCuts: Array<{ start: number; end: number }> = [];
  let cur = cutRanges[0];

  for (let i = 1; i < cutRanges.length; i++) {
    const next = cutRanges[i];
    if (next.start <= cur.end) {
      cur.end = Math.max(cur.end, next.end);
    } else {
      mergedCuts.push(cur);
      cur = next;
    }
  }
  mergedCuts.push(cur);

  // Compute keep intervals
  const keep: KeepInterval[] = [];
  let lastEnd = 0;

  for (const cut of mergedCuts) {
    if (cut.start > lastEnd + 0.05) {
      keep.push({ start: lastEnd, end: cut.start });
    }
    lastEnd = Math.max(lastEnd, cut.end);
  }

  if (lastEnd < totalDuration - 0.05) {
    keep.push({ start: lastEnd, end: totalDuration });
  }

  return keep.length > 0 ? keep : [{ start: 0, end: totalDuration }];
}

export class VideoRendererService {
  public async renderProject(options: FullRenderPipelineOptions): Promise<string> {
    const {
      jobId,
      inputVideoPath,
      outputVideoPath,
      captions = [],
      style = 'classic',
      extendedOptions,
      cuts = [],
      silenceSegments = [],
      zooms = [],
      music,
      globalSpeed = 1.0,
      aspectRatio = '16:9',
      onProgress,
    } = options;

    if (!fs.existsSync(inputVideoPath)) {
      throw new Error(`Input video file not found: ${inputVideoPath}`);
    }

    const duration = await getVideoDuration(inputVideoPath);
    const keepIntervals = calculateKeepIntervals(duration, cuts, silenceSegments);
    const hasCuts = keepIntervals.length > 1 || keepIntervals[0].start > 0 || keepIntervals[0].end < duration - 0.1;

    // Step 1: Create ASS subtitle file if captions present
    let assPath: string | null = null;
    if (captions && captions.length > 0) {
      const sanitized = validateAndSanitizeCaptions({ captions }, duration);
      let assContent: string;
      if (extendedOptions && Object.keys(extendedOptions).length > 0) {
        assContent = captionsToAssCustom(sanitized.captions, extendedOptions, style, aspectRatio);
      } else {
        assContent = captionsToAss(sanitized.captions, style, aspectRatio);
      }
      assPath = path.join(CONFIG.TEMP_DIR, `${jobId}_render.ass`);
      fs.writeFileSync(assPath, assContent, 'utf-8');
    }

    // Step 2: Build FFmpeg filtergraph
    const filterComplex: string[] = [];
    let currentVStream = '0:v';
    let currentAStream = '0:a';

    // 2A. Cuts & Silence Trimming
    if (hasCuts) {
      const vSegments: string[] = [];
      const aSegments: string[] = [];

      keepIntervals.forEach((k, idx) => {
        const vLabel = `vtrim${idx}`;
        const aLabel = `atrim${idx}`;
        filterComplex.push(`[0:v]trim=start=${k.start.toFixed(3)}:end=${k.end.toFixed(3)},setpts=PTS-STARTPTS[${vLabel}]`);
        filterComplex.push(`[0:a]atrim=start=${k.start.toFixed(3)}:end=${k.end.toFixed(3)},asetpts=PTS-STARTPTS[${aLabel}]`);
        vSegments.push(`[${vLabel}]`);
        aSegments.push(`[${aLabel}]`);
      });

      const concatVIn = vSegments.map((v, i) => `${v}${aSegments[i]}`).join('');
      filterComplex.push(`${concatVIn}concat=n=${keepIntervals.length}:v=1:a=1[vcut][acut]`);
      currentVStream = 'vcut';
      currentAStream = 'acut';
    }

    // 2B. Speed Adjustment
    if (globalSpeed && globalSpeed !== 1.0 && globalSpeed >= 0.5 && globalSpeed <= 2.0) {
      const setptsVal = (1 / globalSpeed).toFixed(4);
      filterComplex.push(`[${currentVStream}]setpts=${setptsVal}*PTS[vspeed]`);
      filterComplex.push(`[${currentAStream}]atempo=${globalSpeed.toFixed(2)}[aspeed]`);
      currentVStream = 'vspeed';
      currentAStream = 'aspeed';
    }

    // 2C. Aspect Ratio (Scale to Cover & Center Crop)
    const targetDim = ASPECT_RATIO_DIMS[aspectRatio] || ASPECT_RATIO_DIMS['16:9'];
    const scaleCropFilter = `scale=${targetDim.width}:${targetDim.height}:force_original_aspect_ratio=increase,crop=${targetDim.width}:${targetDim.height}`;
    filterComplex.push(`[${currentVStream}]${scaleCropFilter}[vscaled]`);
    currentVStream = 'vscaled';

    // 2D. Zoom Effects (accepted zooms)
    const acceptedZooms = zooms.filter((z) => z.accepted && z.scale > 1.0 && z.end > z.start);
    if (acceptedZooms.length > 0) {
      // Build dynamic crop zoom expression: crop=w=iw/zoom:h=ih/zoom:x=(iw-iw/zoom)/2:y=(ih-ih/zoom)/2
      // where zoom is piecewise expression: if(between(t, s1, e1), scale1, if(between(t, s2, e2), scale2, 1.0))
      let zoomExpr = '1.0';
      for (const z of acceptedZooms) {
        zoomExpr = `if(between(t,${z.start.toFixed(2)},${z.end.toFixed(2)}),${z.scale.toFixed(2)},${zoomExpr})`;
      }
      const zoomFilter = `crop=w='iw/${zoomExpr}':h='ih/${zoomExpr}':x='(iw-iw/${zoomExpr})/2':y='(ih-ih/${zoomExpr})/2',scale=${targetDim.width}:${targetDim.height}`;
      filterComplex.push(`[${currentVStream}]${zoomFilter}[vzoomed]`);
      currentVStream = 'vzoomed';
    }

    // 2E. Burn ASS Subtitles
    if (assPath && fs.existsSync(assPath)) {
      const escapedAss = escapeFFmpegFilterPath(assPath);
      filterComplex.push(`[${currentVStream}]subtitles=${escapedAss}[vsub]`);
      currentVStream = 'vsub';
    }

    // 2F. Audio Mixing & Music
    const hasMusic = music && music.customAudioPath && fs.existsSync(music.customAudioPath);
    const origVolume = music?.muteOriginalAudio ? 0 : (music?.originalAudioVolume ?? 1.0);

    if (origVolume !== 1.0) {
      filterComplex.push(`[${currentAStream}]volume=${origVolume.toFixed(2)}[avoice]`);
      currentAStream = 'avoice';
    }

    let command = ffmpeg(inputVideoPath);

    if (hasMusic && music && music.customAudioPath) {
      command = command.input(music.customAudioPath);
      const musicVol = music.volume != null ? Math.max(0, Math.min(1, music.volume)) : 0.15;
      const fadeIn = music.fadeIn || 0;
      const fadeOut = music.fadeOut || 0;

      let musicFilters = `volume=${musicVol.toFixed(2)}`;
      if (fadeIn > 0) {
        musicFilters += `,afade=t=in:st=0:d=${fadeIn}`;
      }
      if (fadeOut > 0) {
        musicFilters += `,afade=t=out:st=${Math.max(0, duration - fadeOut).toFixed(2)}:d=${fadeOut}`;
      }

      filterComplex.push(`[1:a]${musicFilters}[amusic]`);
      filterComplex.push(`[${currentAStream}][amusic]amix=inputs=2:duration=first:dropout_transition=2[amixed]`);
      currentAStream = 'amixed';
    }

    // Ensure audio stream is a named filter output if no audio filters were added
    if (currentAStream === '0:a') {
      filterComplex.push('[0:a]anull[aout]');
      currentAStream = 'aout';
    }

    // Ensure video stream is a named filter output if no video filters were added
    if (currentVStream === '0:v') {
      filterComplex.push('[0:v]null[vout]');
      currentVStream = 'vout';
    }

    console.log(`[VideoRenderer] Filter complex contains ${filterComplex.length} filter stages.`);

    return new Promise((resolve, reject) => {
      command
        .complexFilter(filterComplex, [currentVStream, currentAStream])
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset medium',
          '-crf 19',
          '-b:a 192k',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
        ])
        .output(outputVideoPath)
        .on('start', (cmdLine) => {
          console.log(`[VideoRenderer FFmpeg Command]: ${cmdLine}`);
        })
        .on('progress', (prog) => {
          if (prog && prog.percent && onProgress) {
            const clamped = Math.min(99, Math.max(1, Math.round(prog.percent)));
            onProgress(clamped);
          }
        })
        .on('end', () => {
          console.log(`[VideoRenderer] Rendering completed: ${outputVideoPath}`);
          if (assPath) safeDeleteFile(assPath);
          resolve(outputVideoPath);
        })
        .on('error', (err, _stdout, stderr) => {
          console.error('[VideoRenderer Error]:', err.message);
          console.error('[VideoRenderer Stderr]:', stderr);
          if (assPath) safeDeleteFile(assPath);
          reject(new Error(`Video rendering failed: ${err.message}`));
        })
        .run();
    });
  }
}

export const videoRendererService = new VideoRendererService();
