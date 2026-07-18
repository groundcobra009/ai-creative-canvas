import { z } from "zod";

const id = z.string().min(1).max(200);
const elementBase = z.object({ elementId: id });

export const agentCommandSchema = z.discriminatedUnion("type", [
  elementBase.extend({
    type: z.literal("move"),
    dx: z.number().finite().min(-4000).max(4000),
    dy: z.number().finite().min(-4000).max(4000),
  }),
  elementBase.extend({
    type: z.literal("resize"),
    width: z.number().finite().min(10).max(8000).optional(),
    height: z.number().finite().min(10).max(8000).optional(),
  }).refine((command) => command.width !== undefined || command.height !== undefined, {
    message: "幅または高さが必要です",
  }),
  elementBase.extend({
    type: z.literal("setFontSize"),
    fontSize: z.number().finite().min(8).max(320),
  }),
  elementBase.extend({
    type: z.literal("setText"),
    text: z.string().max(2000),
  }),
  elementBase.extend({
    type: z.literal("setColor"),
    property: z.enum(["fill", "stroke"]),
    color: z.string().regex(/^#[0-9a-f]{6}$/i, "色は#RRGGBB形式で指定してください"),
  }),
  elementBase.extend({
    type: z.literal("setVisibility"),
    visible: z.boolean(),
  }),
  z.object({
    type: z.literal("copyVariantPalette"),
    sourceVariantId: id,
  }),
  z.object({
    type: z.literal("copyVariantElement"),
    sourceVariantId: id,
    sourceElementId: id,
    targetElementId: id,
  }),
  elementBase.extend({
    type: z.literal("regenerateImage"),
    prompt: z.string().trim().min(3).max(2000),
  }),
]);

export const rawAgentPlanSchema = z.object({
  summary: z.string().min(1).max(500),
  commands: z.array(agentCommandSchema).min(1).max(8),
  warnings: z.array(z.string().max(300)).max(8).default([]),
});

export const agentPlanResponseSchema = rawAgentPlanSchema.extend({
  provider: z.enum(["local", "gemini"]),
  model: z.string().min(1).max(200),
});

const elementContextSchema = z.object({
  id,
  name: z.string().min(1).max(200),
  type: z.enum(["text", "rect", "ellipse", "image"]),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  text: z.string().max(2000).optional(),
  fontSize: z.number().positive().optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  assetId: z.string().optional(),
});

export const agentCanvasContextSchema = z.object({
  artboard: z.object({
    width: z.number().int().positive().max(8000),
    height: z.number().int().positive().max(8000),
    background: z.string(),
  }),
  selectedId: id.nullable(),
  activeVariantId: id.nullable(),
  elements: z.array(elementContextSchema).max(500),
  variants: z.array(z.object({
    id,
    name: z.string().min(1).max(80),
    direction: z.enum(["photo", "abstract", "typography"]),
    elements: z.array(elementContextSchema).max(500),
  })).max(12),
});

export const agentPlanRequestSchema = z.object({
  instruction: z.string().trim().min(2).max(2000),
  context: agentCanvasContextSchema,
});
