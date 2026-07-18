import type {
  CanvasElement,
  CanvasVariant,
  ImageElement,
  NoteBrief,
  ShapeElement,
  TextElement,
} from "@/features/canvas/types";
import { NOTE_ARTBOARD } from "@/features/canvas/types";
import type { NoteDesignPlan } from "./types";

type VisualAsset = Pick<ImageElement, "src" | "assetId">;

const base = (id: string, name: string, x: number, y: number, width: number, height: number) => ({
  id,
  name,
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
});

const text = (
  id: string,
  name: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  fill: string,
  align: TextElement["align"] = "left",
): TextElement => ({
  ...base(id, name, x, y, width, height),
  type: "text",
  text: value,
  fontSize,
  fontFamily: "Arial, sans-serif",
  fontStyle: "bold",
  fill,
  align,
  lineHeight: 1.18,
});

const shape = (
  id: string,
  name: string,
  type: ShapeElement["type"],
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  cornerRadius = 0,
): ShapeElement => ({
  ...base(id, name, x, y, width, height),
  type,
  fill,
  stroke: "transparent",
  strokeWidth: 0,
  cornerRadius,
});

function photoLayout(id: string, plan: NoteDesignPlan, brief: NoteBrief, visual?: VisualAsset) {
  const elements: CanvasElement[] = [
    shape(`${id}-background`, "背景", "rect", 0, 0, 1280, 670, plan.palette[0]),
    shape(`${id}-accent`, "アクセント", "rect", 68, 72, 12, 118, plan.palette[2], 6),
    text(`${id}-title`, "タイトル", plan.copy, 108, 76, 590, 250, 58, plan.palette[1]),
    text(`${id}-audience`, "想定読者", `FOR ${brief.audience}`, 108, 372, 560, 44, 20, "#687184"),
    text(`${id}-keyword`, "キーワード", brief.keywords.slice(0, 3).join("  /  "), 108, 438, 560, 44, 18, plan.palette[2]),
  ];
  if (visual) {
    elements.push({
      ...base(`${id}-visual`, "キービジュアル", 750, 54, 466, 562),
      type: "image",
      src: visual.src,
      assetId: visual.assetId,
    });
  } else {
    elements.push(
      shape(`${id}-visual`, "ビジュアル背景", "rect", 750, 54, 466, 562, "#e5ddd0", 36),
      shape(`${id}-visual-orb`, "ビジュアル装飾", "ellipse", 858, 155, 250, 250, "#ffb39f"),
      text(`${id}-visual-label`, "ビジュアル案内", "ADD PHOTO\nOR AI VISUAL", 820, 438, 326, 92, 24, "#6d6258", "center"),
    );
  }
  return elements;
}

function abstractLayout(id: string, plan: NoteDesignPlan, brief: NoteBrief) {
  return [
    shape(`${id}-background`, "背景", "rect", 0, 0, 1280, 670, plan.palette[0]),
    shape(`${id}-orb-a`, "装飾A", "ellipse", 868, -90, 430, 430, "#6657d9"),
    shape(`${id}-orb-b`, "装飾B", "ellipse", 960, 334, 260, 260, plan.palette[2]),
    shape(`${id}-line`, "アクセントライン", "rect", 72, 82, 92, 9, plan.palette[2], 5),
    text(`${id}-title`, "タイトル", plan.copy, 72, 118, 760, 310, 64, plan.palette[1]),
    text(`${id}-value`, "読者価値", brief.readerValue, 76, 466, 670, 72, 21, "#b8bdd7"),
    text(`${id}-number`, "案番号", "02", 1112, 530, 84, 52, 28, plan.palette[0], "right"),
  ] satisfies CanvasElement[];
}

function typographyLayout(id: string, plan: NoteDesignPlan, brief: NoteBrief) {
  return [
    shape(`${id}-background`, "背景", "rect", 0, 0, 1280, 670, plan.palette[0]),
    text(`${id}-eyebrow`, "カテゴリ", `NOTE  •  ${brief.keywords[0]?.toUpperCase() ?? "STORY"}`, 72, 62, 620, 42, 19, plan.palette[2]),
    text(`${id}-title-shadow`, "タイトル装飾", plan.copy, 81, 146, 1120, 290, 76, "#d9d2f4", "center"),
    text(`${id}-title`, "タイトル", plan.copy, 72, 136, 1120, 290, 76, plan.palette[1], "center"),
    shape(`${id}-rule`, "区切り線", "rect", 445, 472, 390, 6, plan.palette[2], 3),
    text(`${id}-audience`, "想定読者", brief.audience, 300, 508, 680, 54, 21, "#625d73", "center"),
  ] satisfies CanvasElement[];
}

export function createNoteVariants(
  plans: NoteDesignPlan[],
  brief: NoteBrief,
  visual?: VisualAsset,
): CanvasVariant[] {
  return plans.map((plan) => {
    const id = `note-${plan.direction}-${crypto.randomUUID()}`;
    const elements =
      plan.direction === "photo"
        ? photoLayout(id, plan, brief, visual)
        : plan.direction === "abstract"
          ? abstractLayout(id, plan, brief)
          : typographyLayout(id, plan, brief);
    return {
      id,
      name: plan.label,
      direction: plan.direction,
      artboard: { ...NOTE_ARTBOARD, background: plan.palette[0] },
      elements,
    };
  });
}
