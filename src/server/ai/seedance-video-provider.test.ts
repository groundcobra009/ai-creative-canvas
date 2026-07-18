import { describe, expect, it } from "vitest";
import { buildSeedancePrompt } from "./seedance-video-provider";

describe("buildSeedancePrompt", () => {
  it("keeps creative copy and appends supported options", () => {
    expect(
      buildSeedancePrompt({
        prompt: "  カメラがゆっくり寄る  ",
        duration: 5,
        aspectRatio: "16:9",
        resolution: "720p",
        generateAudio: true,
      }),
    ).toBe(
      "カメラがゆっくり寄る --ratio 16:9 --duration 5 --resolution 720p --generate_audio true --watermark false",
    );
  });
});
