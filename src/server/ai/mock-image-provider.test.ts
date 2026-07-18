import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { MockImageProvider } from "./mock-image-provider";

describe("MockImageProvider", () => {
  it("creates a deterministic 1280x670 PNG", async () => {
    const provider = new MockImageProvider();
    const result = await provider.generate({
      prompt: "日本の静かなワークスペース",
      modelTier: "default",
      aspectRatio: "16:9",
      variation: 0,
    });
    const metadata = await sharp(result.bytes).metadata();

    expect(result.mimeType).toBe("image/png");
    expect(metadata.width).toBe(1280);
    expect(metadata.height).toBe(670);
  });
});
