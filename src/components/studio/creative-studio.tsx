"use client";

import dynamic from "next/dynamic";
import {
  Check,
  ChevronDown,
  Download,
  FileImage,
  LoaderCircle,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasExporter } from "@/components/canvas/canvas-stage";
import { useEditorStore } from "@/features/canvas/store";
import type { ProjectPayload } from "@/features/canvas/types";
import { InspectorPanel } from "./inspector-panel";
import { LayersPanel } from "./layers-panel";
import { LeftSidebar } from "./left-sidebar";

const CanvasStage = dynamic(
  () => import("@/components/canvas/canvas-stage").then((module) => module.CanvasStage),
  { ssr: false, loading: () => <div className="canvas-loading">キャンバスを準備しています…</div> },
);

export function CreativeStudio() {
  const scene = useEditorStore((state) => state.scene);
  const pastLength = useEditorStore((state) => state.past.length);
  const futureLength = useEditorStore((state) => state.future.length);
  const hydrated = useEditorStore((state) => state.hydrated);
  const dirty = useEditorStore((state) => state.dirty);
  const saveState = useEditorStore((state) => state.saveState);
  const loadScene = useEditorStore((state) => state.loadScene);
  const setProjectName = useEditorStore((state) => state.setProjectName);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const removeSelected = useEditorStore((state) => state.removeSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const setSaveState = useEditorStore((state) => state.setSaveState);
  const markSaved = useEditorStore((state) => state.markSaved);
  const exporterRef = useRef<CanvasExporter | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [format, setFormat] = useState<"image/png" | "image/jpeg">("image/png");

  const registerExporter = useCallback((exporter: CanvasExporter | null) => {
    exporterRef.current = exporter;
  }, []);

  const save = useCallback(async () => {
    if (!useEditorStore.getState().hydrated) return;
    const snapshot = useEditorStore.getState().scene;
    setSaveState("saving");
    try {
      const response = await fetch("/api/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) throw new Error("保存に失敗しました");
      if (useEditorStore.getState().scene.updatedAt === snapshot.updatedAt) {
        markSaved();
      } else {
        setSaveState("idle");
      }
    } catch {
      setSaveState("error");
    }
  }, [markSaved, setSaveState]);

  useEffect(() => {
    let active = true;
    fetch("/api/project")
      .then(async (response) => {
        if (!response.ok) throw new Error("プロジェクトを読み込めませんでした");
        return (await response.json()) as ProjectPayload;
      })
      .then((project) => active && loadScene(project.scene))
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "読み込みに失敗しました");
        loadScene(useEditorStore.getState().scene);
      });
    return () => {
      active = false;
    };
  }, [loadScene]);

  useEffect(() => {
    if (!hydrated || !dirty) return;
    const timer = window.setTimeout(save, 1200);
    return () => window.clearTimeout(timer);
  }, [dirty, hydrated, save, scene]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (editing) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (modifier && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [duplicateSelected, redo, removeSelected, undo]);

  const exportArtboard = () => {
    const dataUrl = exporterRef.current?.({ mimeType: format, quality: format === "image/jpeg" ? 0.92 : undefined });
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `${scene.projectName || "note-header"}.${format === "image/png" ? "png" : "jpg"}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="brand-mark"><span>AC</span></div>
        <div className="brand-copy">
          <strong>AI Creative Canvas</strong>
          <span>Personal studio</span>
        </div>
        <div className="topbar-divider" />
        <input
          className="project-name-input"
          aria-label="プロジェクト名"
          value={scene.projectName}
          onChange={(event) => setProjectName(event.target.value)}
        />
        <div className="topbar-actions">
          <span className={`save-status ${saveState}`}>
            {saveState === "saving" ? <LoaderCircle size={14} className="spin" /> : saveState === "error" ? <Save size={14} /> : <Check size={14} />}
            {saveState === "saving" ? "保存中" : saveState === "error" ? "保存エラー" : "保存済み"}
          </span>
          <button type="button" className="icon-button" title="元に戻す" disabled={!pastLength} onClick={undo}><Undo2 size={18} /></button>
          <button type="button" className="icon-button" title="やり直す" disabled={!futureLength} onClick={redo}><Redo2 size={18} /></button>
          <button type="button" className="secondary-button" onClick={save}><Save size={16} />保存</button>
          <div className="export-control">
            <select aria-label="書き出し形式" value={format} onChange={(event) => setFormat(event.target.value as typeof format)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
            </select>
            <ChevronDown size={14} />
          </div>
          <button type="button" className="primary-button" onClick={exportArtboard}><Download size={17} />書き出し</button>
        </div>
      </header>

      {loadError ? <div className="load-warning">{loadError}。新規キャンバスで続行します。</div> : null}

      <div className="studio-body">
        <LeftSidebar />
        <section className="canvas-workspace">
          <div className="workspace-meta">
            <div><FileImage size={15} /><span>note 見出し画像</span></div>
            <span>{scene.artboard.width} × {scene.artboard.height}px</span>
          </div>
          {!hydrated ? <div className="canvas-loading">プロジェクトを読み込んでいます…</div> : <CanvasStage registerExporter={registerExporter} />}
        </section>
        <aside className="right-sidebar">
          <InspectorPanel />
          <LayersPanel />
        </aside>
      </div>
    </main>
  );
}
