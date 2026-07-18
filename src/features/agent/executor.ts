import { syncActiveVariant } from "@/features/canvas/document";
import type { CanvasElement, SceneDocument } from "@/features/canvas/types";
import type { ExecutableCanvasCommand } from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function updateElement(
  scene: SceneDocument,
  elementId: string,
  updater: (element: CanvasElement) => CanvasElement,
) {
  let found = false;
  const elements = scene.elements.map((element) => {
    if (element.id !== elementId) return element;
    found = true;
    return updater(element);
  });
  if (!found) throw new Error(`要素が見つかりません: ${elementId}`);
  return { ...scene, elements };
}

export function executeCanvasCommands(
  source: SceneDocument,
  commands: ExecutableCanvasCommand[],
): SceneDocument {
  let scene = structuredClone(source);
  for (const command of commands) {
    if (command.type === "copyVariantPalette") {
      const variant = scene.variants?.find((item) => item.id === command.sourceVariantId);
      if (!variant) throw new Error("コピー元のデザイン案が見つかりません");
      const sourceByName = new Map(variant.elements.map((element) => [`${element.type}:${element.name}`, element]));
      scene = {
        ...scene,
        artboard: { ...scene.artboard, background: variant.artboard.background },
        elements: scene.elements.map((element) => {
          const sourceElement = sourceByName.get(`${element.type}:${element.name}`);
          if (!sourceElement) return element;
          if (element.type === "text" && sourceElement.type === "text") {
            return { ...element, fill: sourceElement.fill };
          }
          if ((element.type === "rect" || element.type === "ellipse") && sourceElement.type === element.type) {
            return { ...element, fill: sourceElement.fill, stroke: sourceElement.stroke };
          }
          return element;
        }),
      };
      continue;
    }

    if (command.type === "copyVariantElement") {
      const variant = scene.variants?.find((item) => item.id === command.sourceVariantId);
      const sourceElement = variant?.elements.find((item) => item.id === command.sourceElementId);
      if (!sourceElement) throw new Error("コピー元の要素が見つかりません");
      scene = updateElement(scene, command.targetElementId, (target) => {
        if (target.type !== sourceElement.type) throw new Error("異なる種類の要素はコピーできません");
        return { ...structuredClone(sourceElement), id: target.id } as CanvasElement;
      });
      continue;
    }

    scene = updateElement(scene, command.elementId, (element) => {
      switch (command.type) {
        case "move":
          return {
            ...element,
            x: clamp(element.x + command.dx, -element.width + 10, scene.artboard.width - 10),
            y: clamp(element.y + command.dy, -element.height + 10, scene.artboard.height - 10),
          };
        case "resize":
          return {
            ...element,
            width: command.width ?? element.width,
            height: command.height ?? element.height,
          };
        case "setFontSize":
          if (element.type !== "text") throw new Error("テキスト以外の文字サイズは変更できません");
          return { ...element, fontSize: command.fontSize };
        case "setText":
          if (element.type !== "text") throw new Error("テキスト以外の内容は変更できません");
          return { ...element, text: command.text };
        case "setColor":
          if (element.type === "image") throw new Error("画像の色は直接変更できません");
          if (command.property === "stroke" && element.type === "text") {
            throw new Error("テキストに線色は設定できません");
          }
          return { ...element, [command.property]: command.color } as CanvasElement;
        case "setVisibility":
          return { ...element, visible: command.visible };
        case "replaceImage":
          if (element.type !== "image") throw new Error("画像以外は置き換えられません");
          return { ...element, src: command.src, assetId: command.assetId, name: `${element.name} AI再生成` };
      }
    });
  }

  return syncActiveVariant({ ...scene, updatedAt: new Date().toISOString() });
}
