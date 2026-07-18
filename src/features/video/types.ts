export type VideoGenerationKind = "text" | "image";
export type VideoJobStatus =
  | "queued"
  | "submitting"
  | "running"
  | "succeeded"
  | "failed"
  | "timed_out";

export type VideoGenerationRequest = {
  kind: VideoGenerationKind;
  prompt: string;
  sourceAssetId?: string;
  sourceElementId?: string;
  duration: 5 | 10;
  aspectRatio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p";
  generateAudio: boolean;
};

export type VideoJob = {
  id: string;
  status: VideoJobStatus;
  provider: "seedance" | "mock";
  model: string;
  prompt: string;
  request: VideoGenerationRequest;
  remoteJobId: string | null;
  resultAssetId: string | null;
  resultUrl: string | null;
  progress: number;
  error: string | null;
  attempts: number;
  retryOfJobId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type VideoJobListResponse = {
  providerMode: "seedance" | "mock";
  jobs: VideoJob[];
};
