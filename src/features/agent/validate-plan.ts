import type { AgentCanvasContext, AgentCommand } from "./types";

export function validateCommandsAgainstContext(
  commands: AgentCommand[],
  context: AgentCanvasContext,
) {
  const elements = new Map(context.elements.map((element) => [element.id, element]));
  const variants = new Map(context.variants.map((variant) => [variant.id, variant]));
  const regenerationCount = commands.filter((command) => command.type === "regenerateImage").length;
  if (regenerationCount && commands.length !== 1) {
    throw new Error("画像再生成は他の変更と分けて実行してください");
  }

  for (const command of commands) {
    if ("elementId" in command) {
      const element = elements.get(command.elementId);
      if (!element) throw new Error(`要素が見つかりません: ${command.elementId}`);
      if ((command.type === "setText" || command.type === "setFontSize") && element.type !== "text") {
        throw new Error(`${element.name}はテキスト要素ではありません`);
      }
      if (command.type === "setColor" && element.type === "image") {
        throw new Error("画像要素の色は直接変更できません");
      }
      if (command.type === "setColor" && command.property === "stroke" && element.type === "text") {
        throw new Error("テキスト要素に線色は設定できません");
      }
      if (command.type === "regenerateImage" && (element.type !== "image" || !element.assetId)) {
        throw new Error("再生成できる保存済み画像を選択してください");
      }
    }

    if (command.type === "copyVariantPalette") {
      if (!variants.has(command.sourceVariantId)) throw new Error("コピー元のデザイン案が見つかりません");
    }
    if (command.type === "copyVariantElement") {
      const variant = variants.get(command.sourceVariantId);
      const source = variant?.elements.find((element) => element.id === command.sourceElementId);
      const target = elements.get(command.targetElementId);
      if (!source || !target) throw new Error("コピー元またはコピー先の要素が見つかりません");
      if (source.type !== target.type) throw new Error("異なる種類の要素は組み合わせられません");
    }
  }
  return commands;
}
