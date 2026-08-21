import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';

/**
 * Safely delete a file if it exists without throwing unhandled exceptions.
 */
export function safeDeleteFile(filePath?: string): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Cleanup] Successfully deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error(`[Cleanup Error] Failed to delete file ${filePath}:`, error);
  }
}

/**
 * Ensure required directory structure exists on startup.
 */
export function ensureDirsExist(): void {
  const dirs = [
    CONFIG.UPLOAD_DIR,
    path.join(CONFIG.UPLOAD_DIR, 'music'),
    CONFIG.TEMP_DIR,
    CONFIG.OUTPUT_DIR,
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Init] Created directory: ${dir}`);
    }
  }
}

/**
 * Periodically purge files older than retention period from target directories.
 */
export function runStorageRetentionCleaner(): void {
  const dirs = [CONFIG.UPLOAD_DIR, CONFIG.TEMP_DIR, CONFIG.OUTPUT_DIR];
  const now = Date.now();

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    fs.readdir(dir, (err, files) => {
      if (err) return;

      for (const file of files) {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (statErr, stats) => {
          if (statErr) return;
          if (now - stats.mtimeMs > CONFIG.CLEANUP_RETENTION_MS) {
            safeDeleteFile(filePath);
          }
        });
      }
    });
  }
}
