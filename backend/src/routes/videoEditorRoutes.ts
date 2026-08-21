import { Router } from 'express';
import { videoEditorController } from '../controllers/videoEditorController';
import { uploadMusicMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

// AI Video Analysis
router.post('/analyze', videoEditorController.analyzeVideo);
router.get('/analyze/status/:analysisId', videoEditorController.getAnalysisStatus);

// AI Auto Edit (preset or custom)
router.post('/auto-edit', videoEditorController.autoEdit);

// Silence Detection (FFmpeg audio filter)
router.post('/silence-detect', videoEditorController.detectSilenceEndpoint);

// Music Management
router.get('/music/presets', videoEditorController.getMusicPresets);
router.post('/music/upload', uploadMusicMiddleware.single('music'), videoEditorController.uploadMusic);
router.get('/music/stream/:filename', videoEditorController.streamMusic);

// Full Render Pipeline
router.post('/render', videoEditorController.renderVideo);
router.get('/render/status/:jobId', videoEditorController.getRenderStatus);

export default router;
