import { z } from "zod";

const baseElement = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().finite(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  locked: z.boolean(),
});

const textElement = baseElement.extend({
  type: z.literal("text"),
  text: z.string(),
  fontSize: z.number().positive(),
  fontFamily: z.string().min(1),
  fontStyle: z.enum(["normal", "bold"]),
  fill: z.string(),
  align: z.enum(["left", "center", "right"]),
  lineHeight: z.number().positive(),
});

const shapeElement = baseElement.extend({
  type: z.enum(["rect", "ellipse"]),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number().min(0),
  cornerRadius: z.number().min(0),
});

const imageElement = baseElement.extend({
  type: z.literal("image"),
  src: z.string().min(1),
  assetId: z.string().optional(),
});

const canvasElement = z.discriminatedUnion("type", [textElement, shapeElement, imageElement]);

const artboard = z.object({
  width: z.number().int().positive().max(8000),
  height: z.number().int().positive().max(8000),
  background: z.string(),
});

const canvasVariant = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  direction: z.enum(["photo", "abstract", "typography"]),
  artboard,
  elements: z.array(canvasElement).max(500),
});

export const sceneSchema = z.object({
  version: z.literal(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1).max(160),
  artboard,
  elements: z.array(canvasElement).max(500),
  activeVariantId: z.string().optional(),
  variants: z.array(canvasVariant).max(12).optional(),
  noteBrief: z.object({
    title: z.string().max(300),
    body: z.string().max(50_000),
    audience: z.string().max(300),
    keywords: z.array(z.string().max(80)).max(12),
    readerValue: z.string().max(500),
  }).optional(),
  updatedAt: z.string(),
});
