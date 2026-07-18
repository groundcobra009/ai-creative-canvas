"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ImageIcon,
  Lock,
  LockOpen,
  Shapes,
  Type,
} from "lucide-react";
import { useEditorStore } from "@/features/canvas/store";

export function LayersPanel() {
  const elements = useEditorStore((state) => state.scene.elements);
  const selectedId = useEditorStore((state) => state.selectedId);
  const select = useEditorStore((state) => state.select);
  const updateElement = useEditorStore((state) => state.updateElement);
  const reorderSelected = useEditorStore((state) => state.reorderSelected);

  return (
    <section className="layers-panel">
      <div className="panel-title-row">
        <div>
          <span className="eyebrow">Structure</span>
          <h2>レイヤー</h2>
        </div>
        <div className="layer-order-buttons">
          <button type="button" title="前面へ" onClick={() => reorderSelected("forward")}><ChevronUp size={16} /></button>
          <button type="button" title="背面へ" onClick={() => reorderSelected("backward")}><ChevronDown size={16} /></button>
        </div>
      </div>
      <div className="layer-list">
        {[...elements].reverse().map((element) => (
          <div
            key={element.id}
            className={`layer-row ${selectedId === element.id ? "selected" : ""}`}
            onClick={() => select(element.id)}
          >
            <span className="layer-type-icon">
              {element.type === "text" ? <Type size={15} /> : element.type === "image" ? <ImageIcon size={15} /> : <Shapes size={15} />}
            </span>
            <button className="layer-name" type="button" onClick={() => select(element.id)}>{element.name}</button>
            <button
              type="button"
              title={element.visible ? "非表示にする" : "表示する"}
              onClick={(event) => {
                event.stopPropagation();
                updateElement(element.id, { visible: !element.visible });
              }}
            >
              {element.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              type="button"
              title={element.locked ? "ロック解除" : "ロック"}
              onClick={(event) => {
                event.stopPropagation();
                updateElement(element.id, { locked: !element.locked });
              }}
            >
              {element.locked ? <Lock size={15} /> : <LockOpen size={15} />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
