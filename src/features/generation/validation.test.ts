import { describe, expect, it } from "vitest";
import { imageGenerationRequestSchema } from "./validation";

describe("image generation request", () => {
  it("accepts a three-variation generation request", () => {
    expect(
      imageGenerationRequestSchema.safeParse({
        kind: "generate",
        prompt: "静かな朝のワークスペース",
        count: 3,
        modelTier: "default",
        aspectRatio: "16:9",
      }).success,
    ).toBe(true);
  });

  it("requires a source asset for editing", () => {
    const result = imageGenerationRequestSchema.safeParse({
      kind: "edit",
      prompt: "背景を青くする",
      count: 1,
      modelTier: "default",
      aspectRatio: "16:9",
    });
    expect(result.success).toBe(false);
  });
});
