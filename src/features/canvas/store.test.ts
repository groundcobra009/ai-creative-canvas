import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultScene } from "./document";
import { useEditorStore } from "./store";

describe("editor history", () => {
  beforeEach(() => {
    useEditorStore.getState().loadScene(createDefaultScene());
  });

  it("undoes and redoes a committed element update", () => {
    const element = useEditorStore.getState().scene.elements[0];
    const originalX = element.x;

    useEditorStore.getState().updateElement(element.id, { x: originalX + 100 });
    expect(useEditorStore.getState().scene.elements[0].x).toBe(originalX + 100);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().scene.elements[0].x).toBe(originalX);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().scene.elements[0].x).toBe(originalX + 100);
  });
});
