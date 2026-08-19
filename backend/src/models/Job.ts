import mongoose, { Document, Schema } from 'mongoose';
import { CaptionItem, CaptionStyle, JobStatus, LanguageOption } from '../types';

export interface IJobDocument extends Document {
  jobId: string;
  status: JobStatus;
  progress: number;
  message: string;
  inputPath: string;
  filename: string;
  originalName: string;
  mimeType: string;
  language: LanguageOption;
  style: CaptionStyle;
  duration?: number;
  captions?: CaptionItem[];
  assPath?: string;
  srtPath?: string;
  outputPath?: string;
  previewUrl?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CaptionItemSchema = new Schema<CaptionItem>(
  {
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const JobSchema = new Schema<IJobDocument>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ['uploading', 'sending_to_ai', 'analyzing', 'generating_captions', 'rendering', 'completed', 'failed'],
      default: 'uploading',
    },
    progress: { type: Number, default: 0 },
    message: { type: String, default: '' },
    inputPath: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    language: { type: String, default: 'auto' },
    style: { type: String, default: 'classic' },
    duration: { type: Number, default: 0 },
    captions: [CaptionItemSchema],
    assPath: { type: String },
    srtPath: { type: String },
    outputPath: { type: String },
    previewUrl: { type: String },
    downloadUrl: { type: String },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

export const JobModel = mongoose.model<IJobDocument>('CaptionJob', JobSchema);
