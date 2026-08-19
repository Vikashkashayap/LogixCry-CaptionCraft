import { CaptionJob, JobStatus } from '../types';
import { JobModel } from '../models/Job';
import { isDBConnected } from '../config/db';
import { safeDeleteFile } from '../utils/fileCleanup';

class JobStore {
  private jobs: Map<string, CaptionJob> = new Map();

  public createJob(jobData: Omit<CaptionJob, 'createdAt' | 'updatedAt'>): CaptionJob {
    const now = new Date();
    const job: CaptionJob = {
      ...jobData,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);

    // Save to MongoDB asynchronously if connected
    if (isDBConnected()) {
      JobModel.create({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message,
        inputPath: job.inputPath,
        filename: job.filename,
        originalName: job.originalName,
        mimeType: job.mimeType,
        language: job.language,
        style: job.style,
        duration: job.duration || 0,
        captions: job.captions || [],
        assPath: job.assPath,
        srtPath: job.srtPath,
        outputPath: job.outputPath,
        previewUrl: job.previewUrl,
        downloadUrl: job.downloadUrl,
        error: job.error,
      }).catch((err) => {
        console.warn(`[JobStore DB Warning] Failed to insert job ${job.id}:`, err.message);
      });
    }

    return job;
  }

  public getJob(id: string): CaptionJob | undefined {
    return this.jobs.get(id);
  }

  public async getJobAsync(id: string): Promise<CaptionJob | undefined> {
    const memoryJob = this.jobs.get(id);
    if (memoryJob) return memoryJob;

    if (isDBConnected()) {
      try {
        const doc = await JobModel.findOne({ jobId: id }).lean();
        if (doc) {
          const restored: CaptionJob = {
            id: doc.jobId,
            status: doc.status as JobStatus,
            progress: doc.progress,
            message: doc.message,
            inputPath: doc.inputPath,
            filename: doc.filename,
            originalName: doc.originalName,
            mimeType: doc.mimeType,
            language: doc.language as any,
            style: doc.style as any,
            duration: doc.duration,
            captions: doc.captions as any,
            assPath: doc.assPath,
            srtPath: doc.srtPath,
            outputPath: doc.outputPath,
            previewUrl: doc.previewUrl,
            downloadUrl: doc.downloadUrl,
            error: doc.error,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
          this.jobs.set(restored.id, restored);
          return restored;
        }
      } catch (err: any) {
        console.warn(`[JobStore DB Warning] Failed to get job ${id} from DB:`, err.message);
      }
    }
    return undefined;
  }

  public updateJob(id: string, updates: Partial<CaptionJob>): CaptionJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob: CaptionJob = {
      ...job,
      ...updates,
      updatedAt: new Date(),
    };

    this.jobs.set(id, updatedJob);

    // Sync updates to MongoDB asynchronously
    if (isDBConnected()) {
      const dbUpdates: any = { ...updates };
      delete dbUpdates.id;
      JobModel.updateOne({ jobId: id }, { $set: dbUpdates }).catch((err) => {
        console.warn(`[JobStore DB Warning] Failed to update job ${id}:`, err.message);
      });
    }

    return updatedJob;
  }

  public setStatus(id: string, status: JobStatus, progress: number, message: string): void {
    this.updateJob(id, { status, progress, message });
    console.log(`[Job ${id}] Status: ${status} (${progress}%) - ${message}`);
  }

  public failJob(id: string, errorMessage: string): void {
    this.updateJob(id, {
      status: 'failed',
      progress: 0,
      message: 'Processing failed',
      error: errorMessage,
    });
    console.error(`[Job ${id} FAILED]: ${errorMessage}`);
  }

  public async deleteJob(id: string): Promise<boolean> {
    const job = await this.getJobAsync(id);
    if (job) {
      if (job.inputPath) safeDeleteFile(job.inputPath);
      if (job.outputPath) safeDeleteFile(job.outputPath);
      if (job.assPath) safeDeleteFile(job.assPath);
      if (job.srtPath) safeDeleteFile(job.srtPath);
    }

    this.jobs.delete(id);

    if (isDBConnected()) {
      try {
        await JobModel.deleteOne({ jobId: id });
        console.log(`[JobStore] Deleted job ${id} from MongoDB and local storage.`);
      } catch (err: any) {
        console.error(`[JobStore Error] Failed to delete job ${id} from MongoDB:`, err.message);
      }
    }

    return true;
  }

  public getAllJobs(): CaptionJob[] {
    return Array.from(this.jobs.values());
  }

  public async getHistory(limit: number = 30): Promise<CaptionJob[]> {
    if (isDBConnected()) {
      try {
        const docs = await JobModel.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();

        return docs.map((doc) => ({
          id: doc.jobId,
          status: doc.status as JobStatus,
          progress: doc.progress,
          message: doc.message,
          inputPath: doc.inputPath,
          filename: doc.filename,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          language: doc.language as any,
          style: doc.style as any,
          duration: doc.duration,
          captions: doc.captions as any,
          assPath: doc.assPath,
          srtPath: doc.srtPath,
          outputPath: doc.outputPath,
          previewUrl: doc.previewUrl,
          downloadUrl: doc.downloadUrl,
          error: doc.error,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));
      } catch (err: any) {
        console.warn('[JobStore] DB history query failed, falling back to memory:', err.message);
      }
    }

    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const jobStore = new JobStore();
