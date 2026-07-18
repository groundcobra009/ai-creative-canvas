import { describe, expect, it } from "vitest";
import { applyCanvasVariants, createDefaultScene } from "@/features/canvas/document";
import { analyzeNoteBrief } from "@/features/note-skill/analyze";
import { createNoteVariants } from "@/features/note-skill/layouts";
import { sceneSchema } from "./validation";

describe("scene validation", () => {
  it("accepts a persisted project containing three note variants", () => {
    const analysis = analyzeNoteBrief({
      title: "AI活用を始めるための実践ガイド",
      body: "AIを仕事へ安全に取り入れるための基本的な考え方と、今日から試せる手順を詳しく紹介します。",
      audience: "AI初心者の会社員",
    });
    const scene = applyCanvasVariants(
      createDefaultScene(),
      createNoteVariants(analysis.plans, analysis.brief),
      analysis.brief,
    );

    expect(sceneSchema.safeParse(scene).success).toBe(true);
  });
});
