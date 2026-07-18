import { z } from "zod";

export const videoGenerationRequestSchema = z
  .object({
    kind: z.enum(["text", "image"]),
    prompt: z.string().trim().min(3, "指示を3文字以上入力してください").max(2000),
    sourceAssetId: z.string().min(1).optional(),
    sourceElementId: z.string().min(1).optional(),
    duration: z.union([z.literal(5), z.literal(10)]),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]),
    resolution: z.enum(["720p", "1080p"]),
    generateAudio: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.kind === "image" && !value.sourceAssetId) {
      context.addIssue({
        code: "custom",
        path: ["sourceAssetId"],
        message: "動画にする画像を選択してください",
      });
    }
  });
