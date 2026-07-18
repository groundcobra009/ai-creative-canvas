export type GenerationKind = "generate" | "edit";
export type GenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";
export type ImageModelTier = "draft" | "default" | "premium";

export type ImageGenerationRequest = {
  kind: GenerationKind;
  prompt: string;
  count: 1 | 3;
  modelTier: ImageModelTier;
  aspectRatio: "16:9";
  sourceAssetId?: string;
  sourceElementId?: string;
};

export type GenerationAsset = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
};

export type GenerationJob = {
  id: string;
  kind: GenerationKind;
  status: GenerationStatus;
  provider: "gemini" | "mock";
  model: string;
  prompt: string;
  request: ImageGenerationRequest;
  resultAssetIds: string[];
  resultAssets: GenerationAsset[];
  progress: number;
  error: string | null;
  retryOfJobId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type GenerationListResponse = {
  providerMode: "gemini" | "mock";
  jobs: GenerationJob[];
};
