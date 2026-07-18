"use client";

import { Check } from "lucide-react";
import { useEditorStore } from "@/features/canvas/store";

export function VariantStrip() {
  const variants = useEditorStore((state) => state.scene.variants ?? []);
  const activeVariantId = useEditorStore((state) => state.scene.activeVariantId);
  const switchVariant = useEditorStore((state) => state.switchVariant);
  if (!variants.length) return null;

  return (
    <section className="variant-strip" aria-label="デザイン案一覧">
      <div className="variant-strip-copy">
        <strong>3つのデザイン案</strong>
        <span>選んだ案をキャンバスで編集</span>
      </div>
      <div className="variant-thumbnails">
        {variants.map((variant, index) => {
          const title = variant.elements.find((element) => element.type === "text" && element.name === "タイトル");
          const accent = variant.elements.find((element) => (element.type === "rect" || element.type === "ellipse") && element.name !== "背景");
          const active = variant.id === activeVariantId;
          return (
            <button
              key={variant.id}
              type="button"
              className={active ? "active" : ""}
              aria-pressed={active}
              onClick={() => switchVariant(variant.id)}
            >
              <span className="variant-mini-canvas" style={{ background: variant.artboard.background }}>
                <span
                  className="variant-mini-accent"
                  style={{ background: accent && "fill" in accent ? accent.fill : "#6657d9" }}
                />
                <span style={{ color: title?.type === "text" ? title.fill : "#18212f" }}>
                  {title?.type === "text" ? title.text : variant.name}
                </span>
              </span>
              <span className="variant-name">案{index + 1}・{variant.name}</span>
              {active ? <Check size={13} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
