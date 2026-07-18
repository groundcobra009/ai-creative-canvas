import type { GenerateContentResponse } from "@google/genai";
import { describe, expect, it } from "vitest";
import { parseGeminiImageResponse } from "./gemini-image-provider";

describe("parseGeminiImageResponse", () => {
  it("decodes a supported image response", () => {
    const bytes = Buffer.from("test-image");
    const result = parseGeminiImageResponse({
      candidates: [
        {
          content: {
            role: "model",
            parts: [
              {
                inlineData: {
                  data: bytes.toString("base64"),
                  mimeType: "image/png",
                },
              },
            ],
          },
        },
      ],
    } as GenerateContentResponse);

    expect(result.mimeType).toBe("image/png");
    expect(result.bytes).toEqual(bytes);
  });

  it("reports the finish reason when safety filtering returns no image", () => {
    expect(() =>
      parseGeminiImageResponse({
        candidates: [{ finishReason: "SAFETY" }],
      } as GenerateContentResponse),
    ).toThrow("SAFETY");
  });

  it("rejects unsupported response formats", () => {
    expect(() =>
      parseGeminiImageResponse({
        candidates: [
          {
            content: {
              role: "model",
              parts: [
                {
                  inlineData: {
                    data: Buffer.from("pdf").toString("base64"),
                    mimeType: "application/pdf",
                  },
                },
              ],
            },
          },
        ],
      } as GenerateContentResponse),
    ).toThrow("未対応形式");
  });
});
