import { describe, expect, it } from "vitest";
import { analyzeNoteBrief, noteSkillInputSchema, shortenCopy } from "./analyze";

describe("note skill analysis", () => {
  it("rejects empty input", () => {
    expect(noteSkillInputSchema.safeParse({ title: "", body: "", audience: "" }).success).toBe(false);
  });

  it("normalizes Japanese line breaks and produces three directions", () => {
    const result = analyzeNoteBrief({
      title: "生成AIで仕事を変える\r\n実践ガイド",
      body: "生成AIを仕事で安全に活用するための考え方と、今日から試せる手順を具体例とともに解説します。",
      audience: "AI活用を始めたい会社員",
    });
    expect(result.brief.title).not.toContain("\r");
    expect(result.brief.keywords.length).toBeGreaterThan(0);
    expect(result.plans.map((plan) => plan.direction)).toEqual(["photo", "abstract", "typography"]);
  });

  it("shortens a long title for thumbnail readability", () => {
    const copy = shortenCopy("とても長いタイトルを一覧表示でも読みやすい長さへ自動的に整えるための実践的なガイドです", 24);
    expect(Array.from(copy).length).toBeLessThanOrEqual(24);
    expect(copy.endsWith("…")).toBe(true);
  });
});
