"use client";

import { Copy, Lock, Trash2 } from "lucide-react";
import { useEditorStore } from "@/features/canvas/store";
import type { CanvasElement } from "@/features/canvas/types";

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <label className="field compact-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        value={Math.round(value * 100) / 100}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function InspectorPanel() {
  const selectedId = useEditorStore((state) => state.selectedId);
  const element = useEditorStore((state) =>
    state.scene.elements.find((item) => item.id === state.selectedId),
  );
  const updateElement = useEditorStore((state) => state.updateElement);
  const removeSelected = useEditorStore((state) => state.removeSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);

  if (!selectedId || !element) {
    return (
      <section className="inspector-panel inspector-empty">
        <div className="empty-orb" />
        <span className="eyebrow">Inspector</span>
        <h2>要素を選択</h2>
        <p>キャンバスまたはレイヤーから要素を選ぶと、位置やスタイルを編集できます。</p>
      </section>
    );
  }

  const patch = (next: Partial<CanvasElement>) => updateElement(element.id, next);

  return (
    <section className="inspector-panel">
      <div className="panel-title-row">
        <div>
          <span className="eyebrow">Inspector</span>
          <h2>{element.name}</h2>
        </div>
        <span className="element-badge">{element.type}</span>
      </div>

      <div className="inspector-section">
        <h3>配置</h3>
        <div className="field-grid">
          <NumberField label="X" value={element.x} onChange={(x) => patch({ x })} />
          <NumberField label="Y" value={element.y} onChange={(y) => patch({ y })} />
          <NumberField label="W" min={10} value={element.width} onChange={(width) => patch({ width })} />
          <NumberField label="H" min={10} value={element.height} onChange={(height) => patch({ height })} />
          <NumberField label="回転" value={element.rotation} onChange={(rotation) => patch({ rotation })} />
          <NumberField label="透明度" min={0} value={Math.round(element.opacity * 100)} onChange={(opacity) => patch({ opacity: Math.min(1, Math.max(0, opacity / 100)) })} />
        </div>
      </div>

      {element.type === "text" ? (
        <div className="inspector-section">
          <h3>テキスト</h3>
          <label className="field">
            <span>内容</span>
            <textarea value={element.text} rows={4} onChange={(event) => patch({ text: event.target.value })} />
          </label>
          <div className="field-grid">
            <NumberField label="サイズ" min={8} value={element.fontSize} onChange={(fontSize) => patch({ fontSize })} />
            <label className="field compact-field">
              <span>太さ</span>
              <select value={element.fontStyle} onChange={(event) => patch({ fontStyle: event.target.value as "normal" | "bold" })}>
                <option value="normal">標準</option>
                <option value="bold">太字</option>
              </select>
            </label>
          </div>
          <label className="field color-field">
            <span>文字色</span>
            <input type="color" value={element.fill} onChange={(event) => patch({ fill: event.target.value })} />
            <code>{element.fill}</code>
          </label>
        </div>
      ) : null}

      {element.type === "rect" || element.type === "ellipse" ? (
        <div className="inspector-section">
          <h3>図形</h3>
          <label className="field color-field">
            <span>塗り</span>
            <input type="color" value={element.fill} onChange={(event) => patch({ fill: event.target.value })} />
            <code>{element.fill}</code>
          </label>
          <label className="field color-field">
            <span>線</span>
            <input type="color" value={element.stroke === "transparent" ? "#000000" : element.stroke} onChange={(event) => patch({ stroke: event.target.value })} />
            <code>{element.stroke}</code>
          </label>
        </div>
      ) : null}

      <div className="inspector-actions">
        <button type="button" onClick={duplicateSelected}><Copy size={16} />複製</button>
        <button type="button" onClick={() => patch({ locked: !element.locked })}><Lock size={16} />{element.locked ? "解除" : "ロック"}</button>
        <button type="button" className="danger" onClick={removeSelected}><Trash2 size={16} />削除</button>
      </div>
    </section>
  );
}
