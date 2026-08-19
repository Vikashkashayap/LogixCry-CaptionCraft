import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { jobStore } from '../jobs/jobStore';
import { captionService } from '../services/captionService';
import { ApiResponse, CaptionStyle, LanguageOption } from '../types';

export class CaptionController {
  /**
   * Handle POST /api/captions/generate
   */
  public generateCaptions = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'Please select a valid video file to upload.',
          },
        });
        return;
      }

      const language: LanguageOption = (req.body.language as LanguageOption) || 'auto';
      const captionStyle: CaptionStyle = (req.body.captionStyle as CaptionStyle) || 'classic';

      const jobId = uuidv4();
      const job = jobStore.createJob({
        id: jobId,
        status: 'uploading',
        progress: 10,
        message: 'File uploaded successfully. Preparing AI pipeline...',
        inputPath: file.path,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        language,
        style: captionStyle,
      });

      // Launch async processing pipeline in background
      captionService.processJob(jobId).catch((err) => {
        console.error(`[Background Error] Job ${jobId} failed:`, err);
      });

      res.status(200).json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          message: 'Video upload completed. Processing job queued.',
        },
      });
    } catch (error: any) {
      console.error('[GenerateCaptions Error]:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error.message || 'Failed to initialize video processing.',
        },
      });
    }
  };

  /**
   * Handle GET /api/captions/status/:jobId
   */
  public getJobStatus = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { jobId } = req.params;
    const job = await jobStore.getJobAsync(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `No caption processing job found with ID: ${jobId}`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message,
        duration: job.duration,
        language: job.language,
        style: job.style,
        captions: job.captions || [],
        previewUrl: job.previewUrl || null,
        downloadUrl: job.downloadUrl || null,
        error: job.error || null,
      },
    });
  };

  /**
   * Handle GET /api/captions/history
   */
  public getHistory = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const history = await jobStore.getHistory(20);
      res.status(200).json({
        success: true,
        data: history.map((j) => ({
          jobId: j.id,
          originalName: j.originalName,
          status: j.status,
          progress: j.progress,
          language: j.language,
          style: j.style,
          duration: j.duration,
          createdAt: j.createdAt,
          previewUrl: j.previewUrl || null,
          downloadUrl: j.downloadUrl || null,
          captionsCount: j.captions?.length || 0,
        })),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'HISTORY_FETCH_FAILED',
          message: err.message || 'Failed to fetch job history',
        },
      });
    }
  };

  /**
   * Handle GET /api/captions/file/:jobId/download?type=mp4|srt|ass|json
   */
  public downloadFile = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const type = (req.query.type as string) || 'mp4';
    const job = await jobStore.getJobAsync(jobId);

    if (!job) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
      return;
    }

    if (type === 'srt' && job.srtPath && fs.existsSync(job.srtPath)) {
      res.setHeader('Content-Type', 'application/x-subrip');
      res.setHeader('Content-Disposition', `attachment; filename="${path.parse(job.originalName).name}_captions.srt"`);
      res.sendFile(path.resolve(job.srtPath));
      return;
    }

    if (type === 'ass' && job.assPath && fs.existsSync(job.assPath)) {
      res.setHeader('Content-Type', 'text/x-ssa');
      res.setHeader('Content-Disposition', `attachment; filename="${path.parse(job.originalName).name}_captions.ass"`);
      res.sendFile(path.resolve(job.assPath));
      return;
    }

    if (type === 'json' && job.captions) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${path.parse(job.originalName).name}_captions.json"`);
      res.send(JSON.stringify(job.captions, null, 2));
      return;
    }

    // Default: MP4
    if (job.outputPath && fs.existsSync(job.outputPath)) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${path.parse(job.originalName).name}_captioned.mp4"`);
      res.sendFile(path.resolve(job.outputPath));
      return;
    }

    res.status(404).json({
      success: false,
      error: {
        code: 'FILE_NOT_READY',
        message: 'The requested file is not available or rendering is not complete.',
      },
    });
  };

  /**
   * Handle GET /api/captions/file/:jobId/preview (Streams video with HTTP 206 Byte Ranges support)
   */
  public streamPreview = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const job = await jobStore.getJobAsync(jobId);

    const videoPath = job?.outputPath && fs.existsSync(job.outputPath)
      ? job.outputPath
      : job?.inputPath && fs.existsSync(job.inputPath)
        ? job.inputPath
        : null;

    if (!videoPath) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Preview video file not found' } });
      return;
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  };

  /**
   * Handle POST /api/captions/rerender/:jobId
   */
  public rerenderCaptions = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { jobId } = req.params;
    const { captions, captionStyle } = req.body;

    const job = await jobStore.getJobAsync(jobId);
    if (!job) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
      return;
    }

    if (!Array.isArray(captions)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Captions array is required' } });
      return;
    }

    // Launch background re-rendering without calling AI again
    captionService.reRenderJob(jobId, captions, captionStyle).catch((err) => {
      console.error(`[Re-render Error] Job ${jobId}:`, err);
    });

    res.status(200).json({
      success: true,
      data: {
        jobId,
        status: 'rendering',
        message: 'Re-rendering started with updated captions.',
      },
    });
  };

  /**
   * Handle DELETE /api/captions/job/:jobId
   * Deletes job from MongoDB and cleans up associated files on server disk.
   */
  public deleteJob = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const { jobId } = req.params;
      const job = await jobStore.getJobAsync(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Job ${jobId} not found.`,
          },
        });
        return;
      }

      await jobStore.deleteJob(jobId);

      res.status(200).json({
        success: true,
        data: {
          jobId,
          message: 'Video and caption records permanently deleted from server and database.',
        },
      });
    } catch (error: any) {
      console.error('[DeleteJob Error]:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error.message || 'Failed to delete job.',
        },
      });
    }
  };
}

export const captionController = new CaptionController();
