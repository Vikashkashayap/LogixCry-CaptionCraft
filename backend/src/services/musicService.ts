import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { getVideoDuration } from './ffmpegService';

export interface MusicTrackMetadata {
  id: string;
  name: string;
  category: string;
  duration: number;
  filePath?: string;
  url: string;
}

export class MusicService {
  private musicDir: string;

  constructor() {
    this.musicDir = path.join(CONFIG.UPLOAD_DIR, 'music');
    if (!fs.existsSync(this.musicDir)) {
      fs.mkdirSync(this.musicDir, { recursive: true });
    }
  }

  public getMusicDirectory(): string {
    return this.musicDir;
  }

  /**
   * Returns list of built-in royalty-free ambient tracks
   */
  public getPresetTracks(): MusicTrackMetadata[] {
    return [
      {
        id: 'ambient-chill',
        name: 'Lo-Fi Chill Beat',
        category: 'Lo-Fi / Relaxed',
        duration: 120,
        url: '/api/video/music/preset/ambient-chill',
      },
      {
        id: 'upbeat-tech',
        name: 'Modern Tech Pulse',
        category: 'Corporate / Tech',
        duration: 95,
        url: '/api/video/music/preset/upbeat-tech',
      },
      {
        id: 'cinematic-soft',
        name: 'Cinematic Atmosphere',
        category: 'Cinematic / Drama',
        duration: 140,
        url: '/api/video/music/preset/cinematic-soft',
      },
      {
        id: 'energetic-vlog',
        name: 'Upbeat Vlog Energy',
        category: 'Upbeat / Vlog',
        duration: 110,
        url: '/api/video/music/preset/energetic-vlog',
      },
    ];
  }

  /**
   * Probes duration of uploaded audio track
   */
  public async getAudioDuration(audioPath: string): Promise<number> {
    return getVideoDuration(audioPath);
  }
}

export const musicService = new MusicService();
