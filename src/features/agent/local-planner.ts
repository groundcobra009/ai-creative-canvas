import { describeCommand } from "./describe";
import type { AgentCanvasContext, AgentCommand, AgentPlan } from "./types";
import { validateCommandsAgainstContext } from "./validate-plan";

const COLOR_NAMES: Record<string, string> = {
  赤: "#ef4444",
  青: "#2563eb",
  緑: "#16a34a",
  黄: "#eab308",
  紫: "#7c3aed",
  オレンジ: "#f97316",
  白: "#ffffff",
  黒: "#111827",
  グレー: "#6b7280",
};

function findTarget(instruction: string, context: AgentCanvasContext) {
  const named = [...context.elements]
    .sort((a, b) => b.name.length - a.name.length)
    .find((element) => instruction.includes(element.name));
  if (named) return named;
  if (instruction.includes("タイトル")) {
    const title = context.elements.find((element) => element.name.includes("タイトル") && element.type === "text");
    if (title) return title;
  }
  if (instruction.includes("画像") || instruction.includes("人物")) {
    const image = context.elements.find((element) => element.type === "image");
    if (image) return image;
  }
  return context.elements.find((element) => element.id === context.selectedId) ?? null;
}

function getDirectionalDistance(instruction: string, direction: "右" | "左" | "上" | "下") {
  const after = instruction.match(new RegExp(`${direction}(?:へ|に)?[^0-9]{0,3}(\\d{1,4})\\s*(?:px|ピクセル)?`));
  const before = instruction.match(new RegExp(`(\\d{1,4})\\s*(?:px|ピクセル)?(?:ほど)?${direction}`));
  const value = after?.[1] ?? before?.[1];
  return value ? Math.min(2000, Number(value)) : 48;
}

function planVariantOperation(instruction: string, context: AgentCanvasContext) {
  const number = instruction.match(/案\s*([1-9])/i)?.[1];
  if (!number) return null;
  const variant = context.variants[Number(number) - 1];
  if (!variant) throw new Error(`案${number}が見つかりません`);
  if (instruction.includes("配色") || instruction.includes("色合い")) {
    return { type: "copyVariantPalette", sourceVariantId: variant.id } satisfies AgentCommand;
  }

  const source = variant.elements.find((element) => instruction.includes(element.name)) ??
    (instruction.includes("タイトル") ? variant.elements.find((element) => element.name.includes("タイトル")) : null);
  if (!source) return null;
  const target = context.elements.find((element) => element.name === source.name && element.type === source.type) ??
    context.elements.find((element) => element.id === context.selectedId && element.type === source.type);
  if (!target) throw new Error(`${source.name}のコピー先が見つかりません`);
  return {
    type: "copyVariantElement",
    sourceVariantId: variant.id,
    sourceElementId: source.id,
    targetElementId: target.id,
  } satisfies AgentCommand;
}

export function createLocalAgentPlan(
  instruction: string,
  context: AgentCanvasContext,
): AgentPlan {
  const normalized = instruction.trim();
  const variantCommand = planVariantOperation(normalized, context);
  if (variantCommand) {
    return {
      summary: describeCommand(variantCommand, context),
      commands: [variantCommand],
      warnings: [],
      provider: "local",
      model: "rule-based-ja-v1",
    };
  }

  const target = findTarget(normalized, context);
  if (!target) throw new Error("操作する要素を選択するか、要素名を指示に含めてください");
  const commands: AgentCommand[] = [];

  if ((normalized.includes("再生成") || normalized.includes("作り直")) && target.type === "image") {
    const prompt = normalized.replace(/^(画像|人物|選択画像)?を?/, "").replace(/(再生成|作り直して?).*$/, "").trim() || normalized;
    commands.push({ type: "regenerateImage", elementId: target.id, prompt });
  } else {
    const quoted = normalized.match(/[「『](.+?)[」』]/)?.[1];
    if (quoted && target.type === "text") {
      commands.push({ type: "setText", elementId: target.id, text: quoted });
    }

    const explicitFontSize = normalized.match(/(?:文字|フォント)?サイズ[^0-9]*(\d{1,3})/i)?.[1] ??
      (target.type === "text"
        ? normalized.match(/(?:タイトル|見出し)を?(\d{1,3})\s*px(?:に|へ)/i)?.[1]
        : undefined);
    if (explicitFontSize && target.type === "text") {
      commands.push({ type: "setFontSize", elementId: target.id, fontSize: Number(explicitFontSize) });
    } else if ((normalized.includes("大きく") || normalized.includes("小さく")) && target.type === "text") {
      const scale = normalized.includes("小さく") ? 0.85 : 1.2;
      commands.push({
        type: "setFontSize",
        elementId: target.id,
        fontSize: Math.round((target.fontSize ?? 32) * scale),
      });
    } else if (normalized.includes("大きく") || normalized.includes("小さく")) {
      const scale = normalized.includes("小さく") ? 0.85 : 1.2;
      commands.push({
        type: "resize",
        elementId: target.id,
        width: Math.round(target.width * scale),
        height: Math.round(target.height * scale),
      });
    }

    const dx =
      (normalized.includes("右") ? getDirectionalDistance(normalized, "右") : 0) -
      (normalized.includes("左") ? getDirectionalDistance(normalized, "左") : 0);
    const dy =
      (normalized.includes("下") ? getDirectionalDistance(normalized, "下") : 0) -
      (normalized.includes("上") ? getDirectionalDistance(normalized, "上") : 0);
    if (dx || dy) commands.push({ type: "move", elementId: target.id, dx, dy });

    const hex = normalized.match(/#[0-9a-f]{6}/i)?.[0];
    const namedColor = Object.entries(COLOR_NAMES).find(([name]) => normalized.includes(name))?.[1];
    const color = hex ?? namedColor;
    if (color && target.type !== "image") {
      commands.push({ type: "setColor", elementId: target.id, property: "fill", color });
    }

    if (normalized.includes("非表示") || normalized.includes("隠して") || normalized.includes("消して")) {
      commands.push({ type: "setVisibility", elementId: target.id, visible: false });
    } else if (normalized.includes("表示して") || normalized.includes("見せて")) {
      commands.push({ type: "setVisibility", elementId: target.id, visible: true });
    }
  }

  const unique = commands.filter((command, index) =>
    commands.findIndex((candidate) => candidate.type === command.type) === index,
  ).slice(0, 8);
  if (!unique.length) {
    throw new Error("指示を操作へ変換できませんでした。移動・大きさ・文字・色を具体的に指定してください");
  }
  validateCommandsAgainstContext(unique, context);
  return {
    summary: unique.map((command) => describeCommand(command, context)).join("、"),
    commands: unique,
    warnings: ["ローカル解析を使用しました。適用前に変更内容を確認してください"],
    provider: "local",
    model: "rule-based-ja-v1",
  };
}
