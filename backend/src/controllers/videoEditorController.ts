import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';
import { jobStore } from '../jobs/jobStore';
import { ApiResponse } from '../types';
import { VideoEditPlan } from '../types/editor';
import { videoAnalysisService } from '../services/gemini/videoAnalysis';
import { detectSilence } from '../services/ffmpeg/silenceDetector';
import { musicService } from '../services/musicService';
import { videoRendererService } from '../services/ffmpeg/videoRenderer';
import { getVideoDuration } from '../services/ffmpegService';

// Store analysis results in-memory for instant retrieval / status checking
const analysisStore: Map<string, { status: string; plan?: VideoEditPlan; error?: string }> = new Map();

export class VideoEditorController {
  /**
   * Handle POST /api/video/analyze
   */
  public analyzeVideo = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const { videoId } = req.body;
      if (!videoId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_VIDEO_ID', message: 'videoId is required' },
        });
        return;
      }

      const job = await jobStore.getJobAsync(videoId);
      if (!job || !fs.existsSync(job.inputPath)) {
        res.status(404).json({
          success: false,
          error: { code: 'VIDEO_NOT_FOUND', message: `Video source for ${videoId} not found.` },
        });
        return;
      }

      const analysisId = uuidv4();
      analysisStore.set(analysisId, { status: 'analyzing' });

      // Run analysis in background or inline
      const duration = job.duration || (await getVideoDuration(job.inputPath));

      videoAnalysisService
        .analyzeVideo({
          videoPath: job.inputPath,
          mimeType: job.mimeType,
          jobId: videoId,
          duration,
        })
        .then((plan) => {
          analysisStore.set(analysisId, { status: 'completed', plan });
        })
        .catch((err) => {
          console.error(`[VideoEditorController] Analysis ${analysisId} failed:`, err);
          analysisStore.set(analysisId, { status: 'failed', error: err.message });
        });

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          message: 'AI video analysis started.',
        },
      });
    } catch (err: any) {
      console.error('[AnalyzeVideo Error]:', err);
      res.status(500).json({
        success: false,
        error: { code: 'ANALYSIS_FAILED', message: err.message || 'Failed to analyze video.' },
      });
    }
  };

  /**
   * Handle GET /api/video/analyze/status/:analysisId
   */
  public getAnalysisStatus = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { analysisId } = req.params;
    const item = analysisStore.get(analysisId);

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Analysis ID ${analysisId} not found.` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  };

  /**
   * Handle POST /api/video/auto-edit
   */
  public autoEdit = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const { videoId } = req.body;
      const job = await jobStore.getJobAsync(videoId);

      if (!job || !fs.existsSync(job.inputPath)) {
        res.status(404).json({
          success: false,
          error: { code: 'VIDEO_NOT_FOUND', message: `Video source for ${videoId} not found.` },
        });
        return;
      }

      const duration = job.duration || (await getVideoDuration(job.inputPath));

      const plan = await videoAnalysisService.analyzeVideo({
        videoPath: job.inputPath,
        mimeType: job.mimeType,
        jobId: videoId,
        duration,
      });

      res.status(200).json({
        success: true,
        data: {
          plan,
        },
      });
    } catch (err: any) {
      console.error('[AutoEdit Error]:', err);
      res.status(500).json({
        success: false,
        error: { code: 'AUTO_EDIT_FAILED', message: err.message || 'Failed to auto-edit video.' },
      });
    }
  };

  /**
   * Handle POST /api/video/silence-detect
   */
  public detectSilenceEndpoint = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const { videoId, minDuration, noiseThreshold, keepPadding } = req.body;
      const job = await jobStore.getJobAsync(videoId);

      if (!job || !fs.existsSync(job.inputPath)) {
        res.status(404).json({
          success: false,
          error: { code: 'VIDEO_NOT_FOUND', message: `Video source for ${videoId} not found.` },
        });
        return;
      }

      const duration = job.duration || (await getVideoDuration(job.inputPath));

      const segments = await detectSilence(job.inputPath, {
        minDuration: minDuration ? parseFloat(minDuration) : 0.6,
        noiseThreshold: noiseThreshold || '-30dB',
        keepPadding: keepPadding ? parseFloat(keepPadding) : 0.15,
        videoDuration: duration,
      });

      res.status(200).json({
        success: true,
        data: {
          silenceSegments: segments,
        },
      });
    } catch (err: any) {
      console.error('[DetectSilence Error]:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SILENCE_DETECTION_FAILED', message: err.message || 'Silence detection failed.' },
      });
    }
  };

  /**
   * Handle GET /api/video/music/presets
   */
  public getMusicPresets = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
    const presets = musicService.getPresetTracks();
    res.status(200).json({
      success: true,
      data: presets,
    });
  };

  /**
   * Handle POST /api/video/music/upload
   */
  public uploadMusic = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'Please upload an audio file (MP3, WAV, M4A, AAC).' },
        });
        return;
      }

      const duration = await musicService.getAudioDuration(file.path);
      const trackId = path.parse(file.filename).name;

      res.status(200).json({
        success: true,
        data: {
          trackId,
          trackName: file.originalname,
          duration,
          filePath: file.path,
          url: `/api/video/music/stream/${file.filename}`,
        },
      });
    } catch (err: any) {
      console.error('[UploadMusic Error]:', err);
      res.status(500).json({
        success: false,
        error: { code: 'MUSIC_UPLOAD_FAILED', message: err.message || 'Failed to process music file.' },
      });
    }
  };

  /**
   * Handle GET /api/video/music/stream/:filename
   */
  public streamMusic = async (req: Request, res: Response): Promise<void> => {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const musicDir = musicService.getMusicDirectory();
    const filePath = path.join(musicDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Music file not found.' } });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  };

  /**
   * Handle POST /api/video/render
   */
  public renderVideo = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const {
        projectId,
        captions,
        style,
        extendedOptions,
        cuts,
        silenceSegments,
        zooms,
        transitions,
        music,
        speedSegments,
        globalSpeed,
        aspectRatio,
      } = req.body;

      const job = await jobStore.getJobAsync(projectId);
      if (!job || !fs.existsSync(job.inputPath)) {
        res.status(404).json({
          success: false,
          error: { code: 'JOB_NOT_FOUND', message: `Job ${projectId} not found or original video missing.` },
        });
        return;
      }

      jobStore.setStatus(projectId, 'rendering', 5, 'Initializing video editor render pipeline...');
      const outputPath = path.join(CONFIG.OUTPUT_DIR, `${projectId}_edited.mp4`);

      // Run FFmpeg render asynchronously in background
      videoRendererService
        .renderProject({
          jobId: projectId,
          inputVideoPath: job.inputPath,
          outputVideoPath: outputPath,
          captions: captions || job.captions || [],
          style: style || job.style || 'classic',
          extendedOptions,
          cuts,
          silenceSegments,
          zooms,
          transitions,
          music,
          speedSegments,
          globalSpeed,
          aspectRatio: aspectRatio || '16:9',
          onProgress: (percent) => {
            const mapped = Math.min(99, 5 + Math.round((percent / 100) * 94));
            jobStore.setStatus(projectId, 'rendering', mapped, `Rendering video edits: ${percent}%`);
          },
        })
        .then(() => {
          const previewUrl = `/api/captions/file/${projectId}/preview`;
          const downloadUrl = `/api/captions/file/${projectId}/download`;
          jobStore.updateJob(projectId, {
            status: 'completed',
            progress: 100,
            message: 'Video rendering completed successfully!',
            outputPath,
            previewUrl,
            downloadUrl,
          });
        })
        .catch((err) => {
          console.error(`[Render Error] Job ${projectId}:`, err);
          jobStore.failJob(projectId, err.message || 'Video rendering failed.');
        });

      res.status(200).json({
        success: true,
        data: {
          jobId: projectId,
          status: 'rendering',
          message: 'Render job queued successfully.',
        },
      });
    } catch (err: any) {
      console.error('[RenderVideo Error]:', err);
      res.status(500).json({
        success: false,
        error: { code: 'RENDER_FAILED', message: err.message || 'Failed to start rendering.' },
      });
    }
  };

  /**
   * Handle GET /api/video/render/status/:jobId
   */
  public getRenderStatus = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { jobId } = req.params;
    const job = await jobStore.getJobAsync(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: `Job ${jobId} not found.` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        status: job.status,
        progress: job.progress,
        previewUrl: job.previewUrl || null,
        downloadUrl: job.downloadUrl || null,
        error: job.error || null,
      },
    });
  };
}

export const videoEditorController = new VideoEditorController();
