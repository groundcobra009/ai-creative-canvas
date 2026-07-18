import type { CanvasElement, NoteDesignDirection, SceneDocument } from "@/features/canvas/types";

export type AgentElementContext = Pick<
  CanvasElement,
  "id" | "name" | "type" | "x" | "y" | "width" | "height"
> & {
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  assetId?: string;
};

export type AgentVariantContext = {
  id: string;
  name: string;
  direction: NoteDesignDirection;
  elements: AgentElementContext[];
};

export type AgentCanvasContext = {
  artboard: SceneDocument["artboard"];
  selectedId: string | null;
  activeVariantId: string | null;
  elements: AgentElementContext[];
  variants: AgentVariantContext[];
};

export type AgentCommand =
  | { type: "move"; elementId: string; dx: number; dy: number }
  | { type: "resize"; elementId: string; width?: number; height?: number }
  | { type: "setFontSize"; elementId: string; fontSize: number }
  | { type: "setText"; elementId: string; text: string }
  | { type: "setColor"; elementId: string; property: "fill" | "stroke"; color: string }
  | { type: "setVisibility"; elementId: string; visible: boolean }
  | { type: "copyVariantPalette"; sourceVariantId: string }
  | {
      type: "copyVariantElement";
      sourceVariantId: string;
      sourceElementId: string;
      targetElementId: string;
    }
  | { type: "regenerateImage"; elementId: string; prompt: string };

export type ReplaceImageCommand = {
  type: "replaceImage";
  elementId: string;
  assetId: string;
  src: string;
};

export type ExecutableCanvasCommand = Exclude<AgentCommand, { type: "regenerateImage" }> | ReplaceImageCommand;

export type AgentPlan = {
  summary: string;
  commands: AgentCommand[];
  warnings: string[];
  provider: "local" | "gemini";
  model: string;
};
