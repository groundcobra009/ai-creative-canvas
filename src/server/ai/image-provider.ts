import "server-only";

import type { ImageModelTier } from "@/features/generation/types";

export type ProviderImageInput = {
  prompt: string;
  modelTier: ImageModelTier;
  aspectRatio: "16:9";
  variation: number;
  source?: {
    bytes: Buffer;
    mimeType: string;
  };
};

export type ProviderImageOutput = {
  bytes: Buffer;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
};

export interface ImageGenerationProvider {
  readonly id: "gemini" | "mock";
  generate(input: ProviderImageInput): Promise<ProviderImageOutput>;
}

export const IMAGE_MODEL_BY_TIER: Record<ImageModelTier, string> = {
  draft: process.env.IMAGE_MODEL_DRAFT ?? "gemini-3.1-flash-lite-image",
  default: process.env.IMAGE_MODEL_DEFAULT ?? "gemini-3.1-flash-image",
  premium: process.env.IMAGE_MODEL_PREMIUM ?? "gemini-3-pro-image",
};

export function getImageProviderMode(): "gemini" | "mock" {
  const requested = process.env.AI_IMAGE_PROVIDER ?? "auto";
  if (requested === "mock") return "mock";
  if (requested === "gemini" && !process.env.GEMINI_API_KEY) {
    throw new Error("AI_IMAGE_PROVIDER=geminiですがGEMINI_API_KEYが未設定です");
  }
  return process.env.GEMINI_API_KEY ? "gemini" : "mock";
}

export async function createImageProvider(): Promise<ImageGenerationProvider> {
  if (getImageProviderMode() === "gemini") {
    const { GeminiImageProvider } = await import("./gemini-image-provider");
    return new GeminiImageProvider(process.env.GEMINI_API_KEY!);
  }
  const { MockImageProvider } = await import("./mock-image-provider");
  return new MockImageProvider();
}
