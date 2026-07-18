import type { CanvasElement, CanvasVariant, NoteBrief, SceneDocument } from "./types";
import { NOTE_ARTBOARD } from "./types";

const now = () => new Date().toISOString();

export function createDefaultScene(): SceneDocument {
  return {
    version: 1,
    projectId: "default",
    projectName: "はじめてのnote見出し画像",
    artboard: { ...NOTE_ARTBOARD },
    elements: [
      {
        id: "accent-default",
        type: "rect",
        name: "アクセント",
        x: 72,
        y: 82,
        width: 10,
        height: 138,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: "#ff6b4a",
        stroke: "transparent",
        strokeWidth: 0,
        cornerRadius: 6,
      },
      {
        id: "title-default",
        type: "text",
        name: "タイトル",
        x: 112,
        y: 92,
        width: 670,
        height: 180,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "あなたのアイデアを、\n読まれる一枚へ。",
        fontSize: 62,
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
        fill: "#18212f",
        align: "left",
        lineHeight: 1.25,
      },
      {
        id: "subtitle-default",
        type: "text",
        name: "サブタイトル",
        x: 112,
        y: 300,
        width: 570,
        height: 80,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: "AI Creative Canvasでつくる note見出し画像",
        fontSize: 23,
        fontFamily: "Arial, sans-serif",
        fontStyle: "normal",
        fill: "#657083",
        align: "left",
        lineHeight: 1.4,
      },
      {
        id: "visual-default",
        type: "ellipse",
        name: "キービジュアル",
        x: 850,
        y: 116,
        width: 300,
        height: 300,
        rotation: -8,
        opacity: 1,
        visible: true,
        locked: false,
        fill: "#d9f3e9",
        stroke: "#95d8c1",
        strokeWidth: 2,
        cornerRadius: 0,
      },
    ],
    updatedAt: now(),
  };
}

export function cloneScene(scene: SceneDocument): SceneDocument {
  return structuredClone(scene);
}

export function syncActiveVariant(scene: SceneDocument): SceneDocument {
  if (!scene.activeVariantId || !scene.variants?.length) return scene;
  return {
    ...scene,
    variants: scene.variants.map((variant) =>
      variant.id === scene.activeVariantId
        ? { ...variant, artboard: { ...scene.artboard }, elements: structuredClone(scene.elements) }
        : variant,
    ),
  };
}

export function applyCanvasVariants(
  scene: SceneDocument,
  variants: CanvasVariant[],
  noteBrief: NoteBrief,
): SceneDocument {
  const first = variants[0];
  if (!first) return scene;
  return {
    ...scene,
    projectName: noteBrief.title.slice(0, 80),
    artboard: { ...first.artboard },
    elements: structuredClone(first.elements),
    activeVariantId: first.id,
    variants: structuredClone(variants),
    noteBrief: structuredClone(noteBrief),
    updatedAt: now(),
  };
}

export function switchCanvasVariant(
  scene: SceneDocument,
  variantId: string,
): SceneDocument {
  if (variantId === scene.activeVariantId) return scene;
  const synced = syncActiveVariant(scene);
  const target = synced.variants?.find((variant) => variant.id === variantId);
  if (!target || target.id === synced.activeVariantId) return synced;
  return {
    ...synced,
    activeVariantId: target.id,
    artboard: { ...target.artboard },
    elements: structuredClone(target.elements),
    updatedAt: now(),
  };
}

export function updateSceneElement(
  scene: SceneDocument,
  elementId: string,
  patch: Partial<CanvasElement>,
): SceneDocument {
  return {
    ...scene,
    elements: scene.elements.map((element) =>
      element.id === elementId
        ? ({ ...element, ...patch, id: element.id, type: element.type } as CanvasElement)
        : element,
    ),
    updatedAt: now(),
  };
}

export function addSceneElement(
  scene: SceneDocument,
  element: CanvasElement,
): SceneDocument {
  return {
    ...scene,
    elements: [...scene.elements, element],
    updatedAt: now(),
  };
}

export function removeSceneElement(
  scene: SceneDocument,
  elementId: string,
): SceneDocument {
  return {
    ...scene,
    elements: scene.elements.filter((element) => element.id !== elementId),
    updatedAt: now(),
  };
}

export function reorderSceneElement(
  scene: SceneDocument,
  elementId: string,
  direction: "forward" | "backward",
): SceneDocument {
  const index = scene.elements.findIndex((element) => element.id === elementId);
  const target = direction === "forward" ? index + 1 : index - 1;

  if (index < 0 || target < 0 || target >= scene.elements.length) {
    return scene;
  }

  const elements = [...scene.elements];
  [elements[index], elements[target]] = [elements[target], elements[index]];

  return { ...scene, elements, updatedAt: now() };
}

export function renameProject(scene: SceneDocument, name: string): SceneDocument {
  return { ...scene, projectName: name, updatedAt: now() };
}
