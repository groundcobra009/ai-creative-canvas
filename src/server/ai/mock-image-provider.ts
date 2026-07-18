import "server-only";

import sharp from "sharp";
import type {
  ImageGenerationProvider,
  ProviderImageInput,
  ProviderImageOutput,
} from "./image-provider";

function hashPrompt(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function palette(seed: number) {
  const hue = seed % 360;
  return {
    background: `hsl(${hue} 55% 90%)`,
    primary: `hsl(${(hue + 38) % 360} 72% 55%)`,
    secondary: `hsl(${(hue + 198) % 360} 64% 48%)`,
  };
}

function abstractOverlay(seed: number, variation: number) {
  const colors = palette(seed + variation * 71);
  const x = 690 + ((seed >> 4) % 220);
  const y = 170 + ((seed >> 10) % 170);
  return Buffer.from(`
    <svg width="1280" height="670" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${colors.background}"/>
          <stop offset="1" stop-color="#ffffff"/>
        </linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="35"/></filter>
      </defs>
      <rect width="1280" height="670" fill="url(#bg)"/>
      <circle cx="${x}" cy="${y}" r="210" fill="${colors.primary}" opacity="0.72"/>
      <rect x="${x - 80}" y="${y + 120}" width="410" height="240" rx="92"
        fill="${colors.secondary}" opacity="0.54" transform="rotate(-13 ${x} ${y})"/>
      <circle cx="1080" cy="90" r="145" fill="#ffffff" opacity="0.6" filter="url(#blur)"/>
      <path d="M0 565 C280 430 470 690 760 545 C970 440 1100 520 1280 420 L1280 670 L0 670Z"
        fill="#ffffff" opacity="0.64"/>
    </svg>
  `);
}

export class MockImageProvider implements ImageGenerationProvider {
  readonly id = "mock" as const;

  async generate(input: ProviderImageInput): Promise<ProviderImageOutput> {
    const seed = hashPrompt(`${input.prompt}:${input.variation}`);
    const overlay = abstractOverlay(seed, input.variation);
    const pipeline = input.source
      ? sharp(input.source.bytes)
          .resize(1280, 670, { fit: "cover" })
          .modulate({
            brightness: 1.02,
            saturation: 0.82 + (input.variation % 3) * 0.12,
            hue: (input.variation + 1) * 12,
          })
          .composite([{ input: overlay, blend: "soft-light" }])
      : sharp(overlay);

    return {
      bytes: await pipeline.png().toBuffer(),
      mimeType: "image/png",
    };
  }
}
