import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { jobStore } from '../jobs/jobStore';
import { geminiService } from './geminiService';
import { burnSubtitles, getVideoDuration } from './ffmpegService';
import { validateAndSanitizeCaptions } from '../utils/timestampValidator';
import { captionsToAss, captionsToSrt } from '../utils/subtitleFormatter';
import { safeDeleteFile } from '../utils/fileCleanup';
import { CaptionItem, CaptionStyle } from '../types';

export class CaptionService {
  /**
   * Process caption generation job asynchronously in background
   */
  public async processJob(jobId: string): Promise<void> {
    const job = await jobStore.getJobAsync(jobId);
    if (!job) {
      console.error(`[CaptionService] Job ${jobId} not found in jobStore.`);
      return;
    }

    let assPath: string | null = null;
    let srtPath: string | null = null;

    try {
      // Step 1: Probe video duration
      console.log(`[CaptionService] Probing video duration for job ${jobId}...`);
      const durationSeconds = await getVideoDuration(job.inputPath);
      jobStore.updateJob(jobId, { duration: durationSeconds });

      // Step 2: Send to AI for Speech Understanding & Transcription
      jobStore.setStatus(jobId, 'sending_to_ai', 25, 'Sending video audio to AI speech model...');
      
      let rawGeminiResponse;
      try {
        jobStore.setStatus(jobId, 'analyzing', 45, 'Analyzing dialogue and language with Gemini Flash...');
        rawGeminiResponse = await geminiService.generateCaptions({
          videoPath: job.inputPath,
          mimeType: job.mimeType,
          jobId: job.id,
          targetLanguage: job.language,
          duration: durationSeconds,
        });
      } catch (firstError: any) {
        console.warn(`[CaptionService] First AI transcription attempt failed (${firstError.message}). Retrying once...`);
        jobStore.setStatus(jobId, 'analyzing', 50, 'Retrying AI analysis...');
        rawGeminiResponse = await geminiService.generateCaptions({
          videoPath: job.inputPath,
          mimeType: job.mimeType,
          jobId: job.id,
          targetLanguage: job.language,
          duration: durationSeconds,
        });
      }

      // Step 3: Validate and sanitize timestamps
      jobStore.setStatus(jobId, 'generating_captions', 65, 'Validating and formatting caption timestamps...');
      console.log(`[CaptionService] Validating captions timestamp structure for job ${jobId}...`);
      const sanitizedData = validateAndSanitizeCaptions(rawGeminiResponse, durationSeconds);

      jobStore.updateJob(jobId, {
        captions: sanitizedData.captions,
      });

      // Step 4: Generate subtitle files (.ass and .srt)
      const assContent = captionsToAss(sanitizedData.captions, job.style);
      const srtContent = captionsToSrt(sanitizedData.captions);

      assPath = path.join(CONFIG.TEMP_DIR, `${jobId}.ass`);
      srtPath = path.join(CONFIG.TEMP_DIR, `${jobId}.srt`);

      fs.writeFileSync(assPath, assContent, 'utf-8');
      fs.writeFileSync(srtPath, srtContent, 'utf-8');

      jobStore.updateJob(jobId, {
        assPath,
        srtPath,
      });

      // Step 5: Render subtitles into final MP4 using FFmpeg
      jobStore.setStatus(jobId, 'rendering', 75, 'Burning styled captions into MP4 with FFmpeg...');
      const outputPath = path.join(CONFIG.OUTPUT_DIR, `${jobId}_captioned.mp4`);

      await burnSubtitles({
        inputVideoPath: job.inputPath,
        subtitlePath: assPath,
        outputVideoPath: outputPath,
        onProgress: (percent) => {
          const mappedProgress = Math.min(98, 75 + Math.round((percent / 100) * 23));
          jobStore.setStatus(jobId, 'rendering', mappedProgress, `Rendering video: ${percent}%`);
        },
      });

      // Step 6: Complete job
      const previewUrl = `/api/captions/file/${jobId}/preview`;
      const downloadUrl = `/api/captions/file/${jobId}/download`;

      jobStore.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Captions generated and burned successfully!',
        outputPath,
        previewUrl,
        downloadUrl,
      });

      console.log(`[CaptionService] Job ${jobId} completed successfully! Final MP4 created at: ${outputPath}`);

    } catch (error: any) {
      console.error(`[CaptionService Error] Job ${jobId} failed:`, error);
      jobStore.failJob(jobId, error.message || 'An error occurred while generating captions.');

      // Clean temporary subtitle files on failure
      if (assPath) safeDeleteFile(assPath);
      if (srtPath) safeDeleteFile(srtPath);
    }
  }

  /**
   * Re-render video with modified captions or new style
   */
  public async reRenderJob(jobId: string, newCaptions: CaptionItem[], newStyle?: CaptionStyle): Promise<void> {
    const job = await jobStore.getJobAsync(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found.`);
    }

    if (!fs.existsSync(job.inputPath)) {
      throw new Error(`Original video input file is no longer available for re-rendering.`);
    }

    const styleToUse = newStyle || job.style;
    const sanitized = validateAndSanitizeCaptions({ captions: newCaptions }, job.duration);

    jobStore.setStatus(jobId, 'rendering', 10, 'Re-rendering video with updated captions...');

    const assContent = captionsToAss(sanitized.captions, styleToUse);
    const srtContent = captionsToSrt(sanitized.captions);

    const assPath = path.join(CONFIG.TEMP_DIR, `${jobId}.ass`);
    const srtPath = path.join(CONFIG.TEMP_DIR, `${jobId}.srt`);

    fs.writeFileSync(assPath, assContent, 'utf-8');
    fs.writeFileSync(srtPath, srtContent, 'utf-8');

    const outputPath = path.join(CONFIG.OUTPUT_DIR, `${jobId}_captioned.mp4`);

    await burnSubtitles({
      inputVideoPath: job.inputPath,
      subtitlePath: assPath,
      outputVideoPath: outputPath,
      onProgress: (percent) => {
        jobStore.setStatus(jobId, 'rendering', Math.min(98, 10 + Math.round((percent / 100) * 88)), `Rendering: ${percent}%`);
      },
    });

    jobStore.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      message: 'Video re-rendered successfully with custom captions!',
      captions: sanitized.captions,
      style: styleToUse,
      assPath,
      srtPath,
      outputPath,
    });
  }
}

export const captionService = new CaptionService();
