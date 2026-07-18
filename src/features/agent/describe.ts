import type { AgentCanvasContext, AgentCommand } from "./types";

export function describeCommand(command: AgentCommand, context: AgentCanvasContext) {
  const elementId = "elementId" in command ? command.elementId : "targetElementId" in command ? command.targetElementId : null;
  const elementName = context.elements.find((element) => element.id === elementId)?.name ?? "要素";
  switch (command.type) {
    case "move":
      return `${elementName}を横${command.dx}px・縦${command.dy}px移動`;
    case "resize":
      return `${elementName}のサイズを${command.width ?? "維持"} × ${command.height ?? "維持"}pxへ変更`;
    case "setFontSize":
      return `${elementName}の文字サイズを${Math.round(command.fontSize)}pxへ変更`;
    case "setText":
      return `${elementName}を「${command.text.slice(0, 36)}」へ変更`;
    case "setColor":
      return `${elementName}の${command.property === "fill" ? "色" : "線色"}を${command.color}へ変更`;
    case "setVisibility":
      return `${elementName}を${command.visible ? "表示" : "非表示"}に変更`;
    case "copyVariantPalette": {
      const variant = context.variants.find((item) => item.id === command.sourceVariantId);
      return `${variant?.name ?? "別案"}の配色を現在案へ適用`;
    }
    case "copyVariantElement": {
      const variant = context.variants.find((item) => item.id === command.sourceVariantId);
      const source = variant?.elements.find((item) => item.id === command.sourceElementId);
      return `${variant?.name ?? "別案"}の${source?.name ?? "要素"}を${elementName}へ適用`;
    }
    case "regenerateImage":
      return `${elementName}を「${command.prompt.slice(0, 36)}」で再生成`;
  }
}
