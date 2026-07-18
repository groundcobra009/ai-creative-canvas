import { describe, expect, it } from "vitest";
import {
  addSceneElement,
  applyCanvasVariants,
  createDefaultScene,
  removeSceneElement,
  reorderSceneElement,
  switchCanvasVariant,
  updateSceneElement,
} from "./document";
import type { TextElement } from "./types";
import { analyzeNoteBrief } from "../note-skill/analyze";
import { createNoteVariants } from "../note-skill/layouts";

const textElement: TextElement = {
  id: "test-text",
  type: "text",
  name: "テスト",
  x: 0,
  y: 0,
  width: 200,
  height: 80,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  text: "hello",
  fontSize: 32,
  fontFamily: "Arial",
  fontStyle: "normal",
  fill: "#000000",
  align: "left",
  lineHeight: 1.2,
};

describe("scene document operations", () => {
  it("adds, updates and removes an element without mutating the source", () => {
    const source = createDefaultScene();
    const added = addSceneElement(source, textElement);
    const updated = updateSceneElement(added, textElement.id, { text: "updated" });
    const removed = removeSceneElement(updated, textElement.id);

    expect(source.elements).toHaveLength(4);
    expect(added.elements).toHaveLength(5);
    expect(updated.elements.at(-1)).toMatchObject({ text: "updated" });
    expect(removed.elements).toHaveLength(4);
  });

  it("reorders elements within bounds", () => {
    const source = addSceneElement(createDefaultScene(), textElement);
    const moved = reorderSceneElement(source, textElement.id, "backward");

    expect(moved.elements.at(-2)?.id).toBe(textElement.id);
    expect(reorderSceneElement(source, source.elements[0].id, "backward")).toBe(source);
  });

  it("preserves edits when switching between note variants", () => {
    const analysis = analyzeNoteBrief({
      title: "AI活用を始めるためのガイド",
      body: "AIを仕事で使い始めるために必要な考え方と実践手順を、具体的な例と一緒に紹介します。",
      audience: "はじめてAIを使う人",
    });
    const variants = createNoteVariants(analysis.plans, analysis.brief);
    const initial = applyCanvasVariants(createDefaultScene(), variants, analysis.brief);
    const title = initial.elements.find((element) => element.name === "タイトル");
    const edited = updateSceneElement(initial, title!.id, { text: "編集したコピー" });
    const second = switchCanvasVariant(edited, variants[1].id);
    const restored = switchCanvasVariant(second, variants[0].id);

    expect(restored.elements.find((element) => element.id === title!.id)).toMatchObject({
      text: "編集したコピー",
    });
  });
});
