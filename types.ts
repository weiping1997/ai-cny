export interface GeneratedContent {
  type: 'image' | 'video';
  url: string;
  prompt: string;
  createdAt: number;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface UploadedFileState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
  mimeType: string;
}
