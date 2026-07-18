import type { CanvasElement, SceneDocument } from "@/features/canvas/types";
import type { AgentCanvasContext, AgentElementContext } from "./types";

function toElementContext(element: CanvasElement): AgentElementContext {
  return {
    id: element.id,
    name: element.name,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    ...(element.type === "text"
      ? { text: element.text, fontSize: element.fontSize, fill: element.fill }
      : {}),
    ...(element.type === "rect" || element.type === "ellipse"
      ? { fill: element.fill, stroke: element.stroke }
      : {}),
    ...(element.type === "image" ? { assetId: element.assetId } : {}),
  };
}

export function buildAgentContext(
  scene: SceneDocument,
  selectedId: string | null,
): AgentCanvasContext {
  return {
    artboard: { ...scene.artboard },
    selectedId,
    activeVariantId: scene.activeVariantId ?? null,
    elements: scene.elements.map(toElementContext),
    variants: (scene.variants ?? []).map((variant) => ({
      id: variant.id,
      name: variant.name,
      direction: variant.direction,
      elements: variant.elements.map(toElementContext),
    })),
  };
}
