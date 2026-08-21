import { Router } from 'express';
import { captionController } from '../controllers/captionController';
import { uploadVideoMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

// Endpoint to upload video and start async caption generation pipeline
router.post('/generate', uploadVideoMiddleware.single('video'), captionController.generateCaptions);

// Endpoint to fetch recent generation history
router.get('/history', captionController.getHistory);

// Endpoint to poll job status and progress
router.get('/status/:jobId', captionController.getJobStatus);

// Endpoint to download files (MP4, SRT, ASS, JSON)
router.get('/file/:jobId/download', captionController.downloadFile);

// Endpoint to stream the original (unprocessed) uploaded video for editor preview
router.get('/file/:jobId/original', captionController.streamOriginal);

// Endpoint to stream processed video preview
router.get('/file/:jobId/preview', captionController.streamPreview);

// Endpoint to re-render video with modified captions/styles without calling AI
router.post('/rerender/:jobId', captionController.rerenderCaptions);

// Endpoint to permanently delete a job and its files from DB & disk
router.delete('/job/:jobId', captionController.deleteJob);

export default router;
