import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { GoogleGenAI, Type } from '@google/genai';
import { CONFIG } from '../config';
import { GeminiCaptionResponse, LanguageOption } from '../types';
import { extractAudio } from './ffmpegService';
import { safeDeleteFile } from '../utils/fileCleanup';

export class GeminiCaptionService {
  private googleGenAi: GoogleGenAI | null = null;

  constructor() {
    if (CONFIG.GEMINI_API_KEY) {
      this.googleGenAi = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
    }
  }

  /**
   * Builds language-specific instructions for the AI prompt
   */
  private getLanguageInstruction(targetLanguage: LanguageOption = 'auto'): string {
    if (targetLanguage === 'English') {
      return 'Transcribe spoken dialogue in English.';
    } else if (targetLanguage === 'Hindi') {
      return 'Transcribe spoken audio in Hindi using Devanagari script.';
    } else if (targetLanguage === 'Hinglish') {
      return 'Transcribe spoken audio in Hinglish (Hindi transcribed phonetically in Latin/Roman English alphabet).';
    } else {
      return 'Automatically detect the spoken language. Transcribe English in English, Hindi in Devanagari script, or Hinglish if the speaker speaks mixed Hindi-English.';
    }
  }

  /**
   * Builds the strict transcription prompt
   */
  private getPrompt(targetLanguage: LanguageOption = 'auto', estimatedDuration: number = 0): string {
    const langInstruction = this.getLanguageInstruction(targetLanguage);
    return `
You are an expert AI Video Captioning Assistant.
Your task is to listen to the spoken dialogue in the provided media and generate highly accurate, timestamped subtitles/captions.

Rules:
1. Listen carefully to all spoken dialogue from start to end.
2. ${langInstruction}
3. Transcribe actual spoken words accurately without summarizing, paraphrasing, or inventing dialogue.
4. Do NOT include descriptions of background music, ambient noises, or silence.
5. Create short, readable caption segments (3-8 words per segment).
6. Timestamps MUST be in floating-point seconds (e.g., start: 1.25, end: 3.50).
7. Ensure timestamps are strictly monotonically increasing, non-overlapping, and correspond to when the words are spoken.
8. Output ONLY a valid JSON object matching this exact schema:
{
  "language": "Detected language (e.g. English, Hindi, Hinglish)",
  "duration": ${estimatedDuration > 0 ? estimatedDuration.toFixed(1) : 60.0},
  "captions": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Exact spoken words"
    }
  ]
}
`;
  }

  /**
   * Transcribes video/audio using OpenRouter API (Gemini Flash multimodal audio understanding)
   */
  private async generateViaOpenRouter(
    videoPath: string,
    jobId: string,
    targetLanguage: LanguageOption,
    duration: number
  ): Promise<GeminiCaptionResponse> {
    console.log(`[GeminiService/OpenRouter] Extracting audio for AI transcription...`);
    const tempAudioPath = path.join(CONFIG.TEMP_DIR, `${jobId}_audio.mp3`);
    
    try {
      await extractAudio(videoPath, tempAudioPath);
      const audioBuffer = fs.readFileSync(tempAudioPath);
      const base64Audio = audioBuffer.toString('base64');
      const dataUri = `data:audio/mp3;base64,${base64Audio}`;

      console.log(`[GeminiService/OpenRouter] Sending audio (${(audioBuffer.length / 1024).toFixed(1)} KB) to model: ${CONFIG.GEMINI_MODEL}`);
      const prompt = this.getPrompt(targetLanguage, duration);

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: CONFIG.GEMINI_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUri,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 8192,
          temperature: 0.1,
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
      if (!rawText) {
        throw new Error('OpenRouter returned empty response text.');
      }

      console.log(`[GeminiService/OpenRouter] Raw AI Response received (length: ${rawText.length})`);
      
      let parsed: GeminiCaptionResponse;
      try {
        let cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(cleaned) as GeminiCaptionResponse;
      } catch (parseErr: any) {
        console.warn('[GeminiService/OpenRouter] Direct JSON parse failed, attempting repair...', parseErr.message);
        let cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace !== -1) {
          try {
            parsed = JSON.parse(cleaned.substring(0, lastBrace + 1)) as GeminiCaptionResponse;
          } catch {
            // If closed inside captions array
            try {
              parsed = JSON.parse(cleaned.substring(0, lastBrace + 1) + ']}') as GeminiCaptionResponse;
            } catch {
              throw new Error(`Failed to parse AI response JSON: ${parseErr.message}`);
            }
          }
        } else {
          throw new Error(`Failed to parse AI response JSON: ${parseErr.message}`);
        }
      }

      return parsed;
    } finally {
      safeDeleteFile(tempAudioPath);
    }
  }

  /**
   * Transcribes video using Google GenAI SDK Files API
   */
  private async generateViaGoogleSDK(
    videoPath: string,
    mimeType: string,
    targetLanguage: LanguageOption,
    duration: number
  ): Promise<GeminiCaptionResponse> {
    if (!this.googleGenAi) {
      throw new Error('GEMINI_API_KEY is not configured in backend.');
    }

    console.log(`[GeminiService/GoogleGenAI] Uploading video to Gemini Files API: ${videoPath}`);
    const uploadResult = await (this.googleGenAi.files as any).upload({
      file: videoPath,
      mimeType: mimeType,
    });

    const fileRefName = uploadResult.name || uploadResult.uri;
    console.log(`[GeminiService/GoogleGenAI] File uploaded: ${fileRefName}. Waiting for ACTIVE state...`);

    // Poll for active state
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

    const prompt = this.getPrompt(targetLanguage, duration);
    console.log(`[GeminiService/GoogleGenAI] Generating captions with model: ${CONFIG.GEMINI_MODEL}`);

    const response = await this.googleGenAi.models.generateContent({
      model: CONFIG.GEMINI_MODEL.replace('google/', ''),
      contents: [
        file,
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING, description: 'Detected language name' },
            duration: { type: Type.NUMBER, description: 'Video duration in seconds' },
            captions: {
              type: Type.ARRAY,
              description: 'List of timestamped caption segments',
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER, description: 'Start time in seconds' },
                  end: { type: Type.NUMBER, description: 'End time in seconds' },
                  text: { type: Type.STRING, description: 'Spoken text segment' },
                },
                required: ['start', 'end', 'text'],
              },
            },
          },
          required: ['language', 'duration', 'captions'],
        },
      },
    });

    // Clean remote file
    this.googleGenAi.files.delete({ name: fileRefName }).catch(() => {});

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini API returned empty text response.');
    }

    return JSON.parse(rawText) as GeminiCaptionResponse;
  }

  /**
   * Main entry point to transcribe video with AI
   */
  public async generateCaptions(options: {
    videoPath: string;
    mimeType: string;
    jobId: string;
    targetLanguage?: LanguageOption;
    duration?: number;
  }): Promise<GeminiCaptionResponse> {
    const { videoPath, mimeType, jobId, targetLanguage = 'auto', duration = 0 } = options;

    if (CONFIG.OPENROUTER_API_KEY) {
      return this.generateViaOpenRouter(videoPath, jobId, targetLanguage, duration);
    } else if (CONFIG.GEMINI_API_KEY) {
      return this.generateViaGoogleSDK(videoPath, mimeType, targetLanguage, duration);
    } else {
      throw new Error('Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured in backend environment.');
    }
  }
}

export const geminiService = new GeminiCaptionService();
