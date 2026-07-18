import { describe, expect, it } from "vitest";
import { analyzeNoteBrief } from "./analyze";
import { createNoteVariants } from "./layouts";

describe("note thumbnail layouts", () => {
  it("creates three separate 1280x670 editable artboards", () => {
    const analysis = analyzeNoteBrief({
      title: "生成AIで仕事を変える実践ガイド",
      body: "生成AIを毎日の仕事へ取り入れる考え方と、今日から試せる具体的な手順をわかりやすくまとめます。",
      audience: "AI活用を始めたい会社員",
    });
    const variants = createNoteVariants(analysis.plans, analysis.brief);

    expect(variants).toHaveLength(3);
    expect(variants.every((variant) => variant.artboard.width === 1280 && variant.artboard.height === 670)).toBe(true);
    expect(
      variants.every((variant) =>
        variant.elements.some((element) => element.type === "text" && element.name === "タイトル"),
      ),
    ).toBe(true);
    expect(variants[0].elements.some((element) => element.name === "ビジュアル案内")).toBe(true);
  });
});
