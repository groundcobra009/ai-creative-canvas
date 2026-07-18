export const NOTE_ARTBOARD = {
  width: 1280,
  height: 670,
  background: "#ffffff",
} as const;

export type ElementType = "text" | "rect" | "ellipse" | "image";
export type TextAlign = "left" | "center" | "right";

export type BaseCanvasElement = {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
};

export type TextElement = BaseCanvasElement & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "bold";
  fill: string;
  align: TextAlign;
  lineHeight: number;
};

export type ShapeElement = BaseCanvasElement & {
  type: "rect" | "ellipse";
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
};

export type ImageElement = BaseCanvasElement & {
  type: "image";
  src: string;
  assetId?: string;
};

export type CanvasElement = TextElement | ShapeElement | ImageElement;

export type NoteDesignDirection = "photo" | "abstract" | "typography";

export type CanvasVariant = {
  id: string;
  name: string;
  direction: NoteDesignDirection;
  artboard: {
    width: number;
    height: number;
    background: string;
  };
  elements: CanvasElement[];
};

export type NoteBrief = {
  title: string;
  body: string;
  audience: string;
  keywords: string[];
  readerValue: string;
};

export type SceneDocument = {
  version: 1;
  projectId: string;
  projectName: string;
  artboard: {
    width: number;
    height: number;
    background: string;
  };
  elements: CanvasElement[];
  activeVariantId?: string;
  variants?: CanvasVariant[];
  noteBrief?: NoteBrief;
  updatedAt: string;
};

export type ProjectPayload = {
  id: string;
  name: string;
  scene: SceneDocument;
  updatedAt: string;
};
