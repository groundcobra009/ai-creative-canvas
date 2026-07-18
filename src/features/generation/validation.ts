import { z } from "zod";

export const imageGenerationRequestSchema = z
  .object({
    kind: z.enum(["generate", "edit"]),
    prompt: z.string().trim().min(3, "指示を3文字以上入力してください").max(2000),
    count: z.union([z.literal(1), z.literal(3)]),
    modelTier: z.enum(["draft", "default", "premium"]),
    aspectRatio: z.literal("16:9"),
    sourceAssetId: z.string().min(1).optional(),
    sourceElementId: z.string().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (value.kind === "edit" && !value.sourceAssetId) {
      context.addIssue({
        code: "custom",
        path: ["sourceAssetId"],
        message: "編集する画像を選択してください",
      });
    }
  });

export type ValidImageGenerationRequest = z.infer<
  typeof imageGenerationRequestSchema
>;
