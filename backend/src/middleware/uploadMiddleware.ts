import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';

const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/avi',
  'video/x-msvideo',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CONFIG.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.mp4';
    const uniqueFilename = `${uuidv4()}${safeExt}`;
    cb(null, uniqueFilename);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mime) || mime.startsWith('video/');

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported video format. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
};

export const uploadVideoMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: CONFIG.MAX_VIDEO_SIZE_MB * 1024 * 1024,
  },
});

const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
];

const musicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const musicDir = path.join(CONFIG.UPLOAD_DIR, 'music');
    cb(null, musicDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_AUDIO_EXTENSIONS.includes(ext) ? ext : '.mp3';
    const uniqueFilename = `${uuidv4()}${safeExt}`;
    cb(null, uniqueFilename);
  },
});

const musicFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_AUDIO_MIME_TYPES.includes(mime) || mime.startsWith('audio/');

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported audio format. Allowed: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`));
  }
};

export const uploadMusicMiddleware = multer({
  storage: musicStorage,
  fileFilter: musicFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for music
  },
});

