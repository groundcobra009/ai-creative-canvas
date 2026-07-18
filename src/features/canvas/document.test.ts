import { describe, expect, it } from "vitest";
import {
  addSceneElement,
  createDefaultScene,
  removeSceneElement,
  reorderSceneElement,
  updateSceneElement,
} from "./document";
import type { TextElement } from "./types";

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
});
