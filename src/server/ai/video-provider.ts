import "server-only";

import type { VideoGenerationRequest } from "@/features/video/types";

export type VideoProviderSource = {
  bytes: Buffer;
  mimeType: string;
};

export type RemoteVideoResult = {
  status: "queued" | "running" | "succeeded" | "failed";
  videoUrl?: string;
  error?: string;
};

export interface VideoProvider {
  create(input: {
    request: VideoGenerationRequest;
    source?: VideoProviderSource;
  }): Promise<{ remoteJobId: string }>;
  get(remoteJobId: string): Promise<RemoteVideoResult>;
}

export const SEEDANCE_MODEL =
  process.env.SEEDANCE_MODEL ?? "doubao-seedance-1-5-pro-251215";

export function getVideoProviderMode(): "seedance" | "mock" {
  const configured = process.env.AI_VIDEO_PROVIDER ?? "auto";
  if (configured === "mock") return "mock";
  if (configured === "seedance") return "seedance";
  return process.env.SEEDANCE_API_KEY ? "seedance" : "mock";
}

export async function createVideoProvider(): Promise<VideoProvider> {
  if (getVideoProviderMode() === "seedance") {
    const { SeedanceVideoProvider } = await import("./seedance-video-provider");
    return new SeedanceVideoProvider();
  }
  const { MockVideoProvider } = await import("./mock-video-provider");
  return new MockVideoProvider();
}
