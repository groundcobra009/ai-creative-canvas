import { describe, expect, it } from "vitest";
import { createDefaultScene } from "@/features/canvas/document";
import { applyCanvasVariants } from "@/features/canvas/document";
import { analyzeNoteBrief } from "@/features/note-skill/analyze";
import { createNoteVariants } from "@/features/note-skill/layouts";
import { buildAgentContext } from "./context";
import { executeCanvasCommands } from "./executor";
import { createLocalAgentPlan } from "./local-planner";
import { rawAgentPlanSchema } from "./schema";
import { validateCommandsAgainstContext } from "./validate-plan";

describe("canvas agent", () => {
  it("plans a Japanese size and movement instruction", () => {
    const scene = createDefaultScene();
    const context = buildAgentContext(scene, "title-default");
    const plan = createLocalAgentPlan("タイトルを大きくして右へ移動", context);

    expect(plan.commands.map((command) => command.type)).toEqual(["setFontSize", "move"]);
    expect(plan.summary).toContain("タイトル");
  });

  it("keeps font size and movement distance separate", () => {
    const context = buildAgentContext(createDefaultScene(), "title-default");
    const plan = createLocalAgentPlan("タイトルを72pxにして右へ50px", context);
    expect(plan.commands).toEqual([
      { type: "setFontSize", elementId: "title-default", fontSize: 72 },
      { type: "move", elementId: "title-default", dx: 50, dy: 0 },
    ]);
  });

  it("rejects an unknown element id", () => {
    const context = buildAgentContext(createDefaultScene(), null);
    expect(() =>
      validateCommandsAgainstContext(
        [{ type: "move", elementId: "missing", dx: 10, dy: 0 }],
        context,
      ),
    ).toThrow("要素が見つかりません");
  });

  it("does not mutate the source on partial execution failure", () => {
    const scene = createDefaultScene();
    const before = structuredClone(scene);
    expect(() =>
      executeCanvasCommands(scene, [
        { type: "move", elementId: "title-default", dx: 100, dy: 0 },
        { type: "move", elementId: "missing", dx: 100, dy: 0 },
      ]),
    ).toThrow("要素が見つかりません");
    expect(scene).toEqual(before);
  });

  it("rejects malformed plan JSON", () => {
    expect(
      rawAgentPlanSchema.safeParse({
        summary: "危険な操作",
        commands: [{ type: "runCode", code: "deleteEverything()" }],
        warnings: [],
      }).success,
    ).toBe(false);
  });

  it("executes all direct edit commands", () => {
    const scene = createDefaultScene();
    const result = executeCanvasCommands(scene, [
      { type: "move", elementId: "title-default", dx: 20, dy: 10 },
      { type: "resize", elementId: "title-default", width: 720, height: 200 },
      { type: "setFontSize", elementId: "title-default", fontSize: 72 },
      { type: "setText", elementId: "title-default", text: "新しいタイトル" },
      { type: "setColor", elementId: "title-default", property: "fill", color: "#2563eb" },
      { type: "setVisibility", elementId: "subtitle-default", visible: false },
    ]);
    expect(result.elements.find((element) => element.id === "title-default")).toMatchObject({
      x: 132,
      y: 102,
      width: 720,
      height: 200,
      fontSize: 72,
      text: "新しいタイトル",
      fill: "#2563eb",
    });
    expect(result.elements.find((element) => element.id === "subtitle-default")).toMatchObject({ visible: false });
  });

  it("copies palettes and editable elements between variants", () => {
    const analysis = analyzeNoteBrief({
      title: "AI活用を始める実践ガイド",
      body: "AIを毎日の仕事へ取り入れるための基本と、今日から試せる具体的な手順を詳しく紹介します。",
      audience: "AI初心者の会社員",
    });
    const variants = createNoteVariants(analysis.plans, analysis.brief);
    const scene = applyCanvasVariants(createDefaultScene(), variants, analysis.brief);
    const sourceTitle = variants[1].elements.find((element) => element.name === "タイトル")!;
    const targetTitle = scene.elements.find((element) => element.name === "タイトル")!;
    const result = executeCanvasCommands(scene, [
      { type: "copyVariantPalette", sourceVariantId: variants[1].id },
      {
        type: "copyVariantElement",
        sourceVariantId: variants[1].id,
        sourceElementId: sourceTitle.id,
        targetElementId: targetTitle.id,
      },
    ]);
    expect(result.artboard.background).toBe(variants[1].artboard.background);
    expect(result.elements.find((element) => element.id === targetTitle.id)).toMatchObject({
      id: targetTitle.id,
      type: "text",
      text: sourceTitle.type === "text" ? sourceTitle.text : "",
    });
  });

  it("validates image regeneration as an isolated operation", () => {
    const scene = createDefaultScene();
    scene.elements.push({
      id: "saved-image",
      type: "image",
      name: "人物画像",
      x: 800,
      y: 80,
      width: 320,
      height: 400,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      src: "/api/assets/source",
      assetId: "source",
    });
    const context = buildAgentContext(scene, "saved-image");
    expect(
      validateCommandsAgainstContext(
        [{ type: "regenerateImage", elementId: "saved-image", prompt: "背景を夕焼けに変更" }],
        context,
      ),
    ).toHaveLength(1);
    expect(() =>
      validateCommandsAgainstContext(
        [
          { type: "regenerateImage", elementId: "saved-image", prompt: "背景を夕焼けに変更" },
          { type: "move", elementId: "saved-image", dx: 20, dy: 0 },
        ],
        context,
      ),
    ).toThrow("他の変更と分けて");
    const replaced = executeCanvasCommands(scene, [
      { type: "replaceImage", elementId: "saved-image", assetId: "new-asset", src: "/api/assets/new-asset" },
    ]);
    expect(replaced.elements.find((element) => element.id === "saved-image")).toMatchObject({
      assetId: "new-asset",
      src: "/api/assets/new-asset",
    });
  });
});
