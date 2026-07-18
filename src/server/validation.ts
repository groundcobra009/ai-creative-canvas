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

export const sceneSchema = z.object({
  version: z.literal(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1).max(160),
  artboard: z.object({
    width: z.number().int().positive().max(8000),
    height: z.number().int().positive().max(8000),
    background: z.string(),
  }),
  elements: z.array(z.discriminatedUnion("type", [textElement, shapeElement, imageElement])).max(500),
  updatedAt: z.string(),
});
