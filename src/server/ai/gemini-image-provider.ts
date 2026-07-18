import "server-only";

import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import type {
  ImageGenerationProvider,
  ProviderImageInput,
  ProviderImageOutput,
} from "./image-provider";
import { IMAGE_MODEL_BY_TIER } from "./image-provider";

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function getRequestTimeout() {
  const configured = Number(process.env.GEMINI_IMAGE_TIMEOUT_MS ?? 180_000);
  return Number.isFinite(configured) && configured > 0 ? configured : 180_000;
}

export function parseGeminiImageResponse(
  response: GenerateContentResponse,
): ProviderImageOutput {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => Boolean(part.inlineData?.data));
  const data = imagePart?.inlineData?.data;
  if (!data) {
    const finishReason = response.candidates?.[0]?.finishReason;
    throw new Error(
      finishReason
        ? `Geminiが画像を返しませんでした（${finishReason}）`
        : "Geminiが画像を返しませんでした",
    );
  }

  const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";
  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error(`Geminiが未対応形式を返しました: ${mimeType}`);
  }

  return {
    bytes: Buffer.from(data, "base64"),
    mimeType: mimeType as ProviderImageOutput["mimeType"],
  };
}

export class GeminiImageProvider implements ImageGenerationProvider {
  readonly id = "gemini" as const;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(input: ProviderImageInput): Promise<ProviderImageOutput> {
    const model = IMAGE_MODEL_BY_TIER[input.modelTier];
    const instruction = [
      input.prompt,
      `横長${input.aspectRatio}の構図。バリエーション${input.variation + 1}。`,
      "デザイン素材として使いやすい余白を残し、ロゴや透かしを追加しないでください。",
    ].join("\n");
    const contents = input.source
      ? [
          { text: instruction },
          {
            inlineData: {
              mimeType: input.source.mimeType,
              data: input.source.bytes.toString("base64"),
            },
          },
        ]
      : instruction;

    const response = await this.client.models.generateContent({
      model,
      contents,
      config: {
        httpOptions: {
          timeout: getRequestTimeout(),
          retryOptions: { attempts: 3 },
        },
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: input.aspectRatio,
          imageSize: input.modelTier === "draft" ? "1K" : "2K",
        },
      },
    });
    return parseGeminiImageResponse(response);
  }
}
