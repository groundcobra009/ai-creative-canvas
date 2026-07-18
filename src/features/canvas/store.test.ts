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

  it("undoes multiple agent commands as one operation", () => {
    const before = structuredClone(useEditorStore.getState().scene);
    useEditorStore.getState().applyAgentCommands([
      { type: "setFontSize", elementId: "title-default", fontSize: 88 },
      { type: "move", elementId: "title-default", dx: 60, dy: 24 },
    ]);

    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(useEditorStore.getState().scene.elements.find((element) => element.id === "title-default")).toMatchObject({
      fontSize: 88,
      x: 172,
      y: 116,
    });
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().scene).toEqual(before);
  });
});
