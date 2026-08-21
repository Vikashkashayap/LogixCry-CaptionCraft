import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { GoogleGenAI, Type } from '@google/genai';
import { CONFIG } from '../../config';
import { VideoEditPlan } from '../../types/editor';
import { extractAudio } from '../ffmpegService';
import { safeDeleteFile } from '../../utils/fileCleanup';
import { validateEditPlan } from '../../utils/editPlanValidator';

export class VideoAnalysisService {
  private googleGenAi: GoogleGenAI | null = null;

  constructor() {
    if (CONFIG.GEMINI_API_KEY) {
      this.googleGenAi = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
    }
  }

  private getAnalysisPrompt(duration: number): string {
    return `
You are an expert AI Video Editor.
Your task is to analyze the audio and content of the video (duration: ${duration.toFixed(1)} seconds) and generate a comprehensive, professional, non-destructive Video Edit Plan.

Guidelines:
1. Do not summarize the entire video; focus strictly on editing opportunities.
2. Identify scenes with brief semantic descriptions.
3. Suggest conservative cuts for unnecessary introductions, long pauses, repeated statements, obvious verbal flubs, or dead air. Do not aggressively delete valuable dialogue.
4. Detect high-impact highlights (score 0.1 to 1.0) for key moments, important explanations, emotional peaks, or punchlines.
5. Suggest subtle zoom effects (scale between 1.05 and 1.25, default 1.10) for strong emphasis or punchlines.
6. Suggest smooth transitions ('cut', 'fade', 'crossfade', duration 0.2 to 0.5s) only where there are meaningful scene changes.
7. Identify the strongest opening/hook in the video (score 0.1 to 1.0) that grabs immediate viewer attention.
8. Output ONLY a valid JSON object matching this exact schema:

{
  "duration": ${duration.toFixed(1)},
  "scenes": [
    { "start": 0.0, "end": 10.0, "description": "Introduction" }
  ],
  "suggestedCuts": [
    { "start": 2.5, "end": 4.8, "reason": "Filler pause and hesitation" }
  ],
  "highlights": [
    { "start": 12.0, "end": 20.5, "score": 0.95, "reason": "Core insight" }
  ],
  "zooms": [
    { "start": 12.5, "end": 15.0, "scale": 1.1, "reason": "Emphasis on key takeaway" }
  ],
  "transitions": [
    { "type": "crossfade", "time": 10.0, "duration": 0.3, "reason": "Transition to main topic" }
  ],
  "hook": {
    "start": 5.0,
    "end": 12.0,
    "score": 0.92,
    "reason": "High-energy hook statement"
  },
  "recommendations": [
    "Trim initial silence",
    "Add dynamic zoom at key revelation"
  ]
}
`;
  }

  private async analyzeViaOpenRouter(
    videoPath: string,
    jobId: string,
    duration: number
  ): Promise<VideoEditPlan> {
    console.log(`[VideoAnalysis/OpenRouter] Extracting audio for AI video analysis...`);
    const tempAudioPath = path.join(CONFIG.TEMP_DIR, `${jobId}_analysis_audio.mp3`);

    try {
      await extractAudio(videoPath, tempAudioPath);
      const audioBuffer = fs.readFileSync(tempAudioPath);
      const base64Audio = audioBuffer.toString('base64');
      const dataUri = `data:audio/mp3;base64,${base64Audio}`;

      console.log(`[VideoAnalysis/OpenRouter] Sending audio to ${CONFIG.GEMINI_MODEL}...`);
      const prompt = this.getAnalysisPrompt(duration);

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: CONFIG.GEMINI_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: dataUri } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 8192,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 180000,
        }
      );

      const rawText = response.data?.choices?.[0]?.message?.content;
      if (!rawText) throw new Error('OpenRouter returned empty video analysis response.');

      let parsed: any;
      try {
        let cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (err: any) {
        console.warn('[VideoAnalysis/OpenRouter] JSON parse failed, attempting auto-repair...', err.message);
        let cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace !== -1) {
          try {
            parsed = JSON.parse(cleaned.substring(0, lastBrace + 1));
          } catch {
            parsed = {};
          }
        } else {
          parsed = {};
        }
      }

      const { plan } = validateEditPlan(parsed, duration);
      return plan;
    } finally {
      safeDeleteFile(tempAudioPath);
    }
  }

  private async analyzeViaGoogleSDK(
    videoPath: string,
    mimeType: string,
    duration: number
  ): Promise<VideoEditPlan> {
    if (!this.googleGenAi) {
      throw new Error('GEMINI_API_KEY is not configured in backend.');
    }

    console.log(`[VideoAnalysis/GoogleGenAI] Uploading video for analysis: ${videoPath}`);
    const uploadResult = await (this.googleGenAi.files as any).upload({
      file: videoPath,
      mimeType: mimeType,
    });

    const fileRefName = uploadResult.name || uploadResult.uri;
    let file = await this.googleGenAi.files.get({ name: fileRefName });
    const startTime = Date.now();

    while (file.state === 'PROCESSING') {
      if (Date.now() - startTime > 180000) {
        throw new Error('Timed out waiting for Gemini video processing.');
      }
      await new Promise((r) => setTimeout(r, 3000));
      file = await this.googleGenAi.files.get({ name: fileRefName });
    }

    if (file.state === 'FAILED') {
      throw new Error('Gemini video processing failed on remote server.');
    }

    const prompt = this.getAnalysisPrompt(duration);

    const response = await this.googleGenAi.models.generateContent({
      model: CONFIG.GEMINI_MODEL.replace('google/', ''),
      contents: [file, { text: prompt }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            duration: { type: Type.NUMBER },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ['start', 'end', 'description'],
              },
            },
            suggestedCuts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['start', 'end', 'reason'],
              },
            },
            highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  score: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['start', 'end', 'score', 'reason'],
              },
            },
            zooms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  scale: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['start', 'end', 'scale'],
              },
            },
            transitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  time: { type: Type.NUMBER },
                  duration: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['type', 'time', 'duration'],
              },
            },
            hook: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
                score: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ['start', 'end', 'score', 'reason'],
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['duration', 'scenes', 'suggestedCuts', 'highlights', 'zooms', 'recommendations'],
        },
      },
    });

    this.googleGenAi.files.delete({ name: fileRefName }).catch(() => {});

    const rawText = response.text;
    if (!rawText) throw new Error('Gemini API returned empty video analysis.');

    const parsed = JSON.parse(rawText);
    const { plan } = validateEditPlan(parsed, duration);
    return plan;
  }

  public async analyzeVideo(options: {
    videoPath: string;
    mimeType: string;
    jobId: string;
    duration: number;
  }): Promise<VideoEditPlan> {
    const { videoPath, mimeType, jobId, duration } = options;

    if (CONFIG.OPENROUTER_API_KEY) {
      return this.analyzeViaOpenRouter(videoPath, jobId, duration);
    } else if (CONFIG.GEMINI_API_KEY) {
      return this.analyzeViaGoogleSDK(videoPath, mimeType, duration);
    } else {
      throw new Error('Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured in backend.');
    }
  }
}

export const videoAnalysisService = new VideoAnalysisService();
