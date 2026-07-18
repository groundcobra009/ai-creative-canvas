"use client";

import {
  Circle,
  ImagePlus,
  Layers3,
  LayoutTemplate,
  RectangleHorizontal,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { GenerationPanel } from "@/components/generation/generation-panel";
import { useEditorStore } from "@/features/canvas/store";
import type { CanvasElement } from "@/features/canvas/types";

const makeBase = (type: CanvasElement["type"], name: string) => ({
  id: crypto.randomUUID(),
  type,
  name,
  x: 180,
  y: 170,
  width: 360,
  height: 120,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
});

export function LeftSidebar() {
  const addElement = useEditorStore((state) => state.addElement);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const addText = () =>
    addElement({
      ...makeBase("text", "テキスト"),
      type: "text",
      text: "テキストを入力",
      fontSize: 48,
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
      fill: "#18212f",
      align: "left",
      lineHeight: 1.25,
    });

  const addShape = (type: "rect" | "ellipse") =>
    addElement({
      ...makeBase(type, type === "rect" ? "四角形" : "円"),
      type,
      width: type === "ellipse" ? 220 : 360,
      height: type === "ellipse" ? 220 : 180,
      fill: type === "ellipse" ? "#d9f3e9" : "#f3e8ff",
      stroke: type === "ellipse" ? "#94d7c0" : "#c4a7e7",
      strokeWidth: 2,
      cornerRadius: type === "rect" ? 24 : 0,
    });

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/assets", { method: "POST", body: form });
      const result = (await response.json()) as { id?: string; url?: string; error?: string };
      if (!response.ok || !result.url || !result.id) {
        throw new Error(result.error ?? "画像をアップロードできませんでした");
      }
      addElement({
        ...makeBase("image", file.name),
        type: "image",
        width: 520,
        height: 320,
        src: result.url,
        assetId: result.id,
      });
      setMessage("画像を追加しました");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <aside className="left-sidebar">
      <nav className="tool-rail" aria-label="キャンバスツール">
        <button className="rail-button active" aria-label="スキル">
          <Sparkles size={19} />
          <span>Skills</span>
        </button>
        <button className="rail-button" aria-label="素材">
          <ImagePlus size={19} />
          <span>素材</span>
        </button>
        <button className="rail-button" aria-label="要素">
          <LayoutTemplate size={19} />
          <span>要素</span>
        </button>
        <button className="rail-button" aria-label="レイヤー">
          <Layers3 size={19} />
          <span>Layers</span>
        </button>
      </nav>

      <section className="sidebar-panel">
        <div className="sidebar-heading">
          <span className="eyebrow">Creative skill</span>
          <h2>note 見出し画像</h2>
          <p>記事の魅力を、1280 × 670pxの一枚に。</p>
        </div>

        <GenerationPanel />

        <div className="sidebar-section">
          <h3>キャンバスに追加</h3>
          <div className="element-grid">
            <button type="button" onClick={addText}><Type size={20} />テキスト</button>
            <button type="button" onClick={() => addShape("rect")}><RectangleHorizontal size={20} />四角形</button>
            <button type="button" onClick={() => addShape("ellipse")}><Circle size={20} />円</button>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload size={20} />{uploading ? "保存中" : "画像"}
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => uploadImage(event.target.files?.[0])}
          />
          {message ? <p className="sidebar-message">{message}</p> : null}
        </div>
      </section>
    </aside>
  );
}
