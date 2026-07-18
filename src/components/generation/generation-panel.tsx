"use client";

import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/features/canvas/store";
import type {
  GenerationJob,
  GenerationListResponse,
  ImageModelTier,
} from "@/features/generation/types";

const statusLabel: Record<GenerationJob["status"], string> = {
  queued: "待機中",
  running: "生成中",
  succeeded: "完了",
  failed: "失敗",
  cancelled: "中止",
};

export function GenerationPanel() {
  const selectedElement = useEditorStore((state) =>
    state.scene.elements.find((element) => element.id === state.selectedId),
  );
  const addElement = useEditorStore((state) => state.addElement);
  const updateElement = useEditorStore((state) => state.updateElement);
  const [mode, setMode] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState<1 | 3>(3);
  const [modelTier, setModelTier] = useState<ImageModelTier>("default");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [providerMode, setProviderMode] = useState<"gemini" | "mock">("mock");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pendingPlacement = useRef(new Set<string>());

  const selectedImage = selectedElement?.type === "image" ? selectedElement : null;

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/generations", { cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as GenerationListResponse;
      setJobs(result.jobs);
      setProviderMode(result.providerMode);
    } catch {
      // A transient polling error should not clear the existing history.
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(fetchJobs, 0);
    const timer = window.setInterval(fetchJobs, 1600);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [fetchJobs]);

  const placeJob = useCallback(
    (job: GenerationJob) => {
      if (!job.resultAssets.length) return;
      if (job.kind === "edit" && job.request.sourceElementId) {
        const source = useEditorStore
          .getState()
          .scene.elements.find((element) => element.id === job.request.sourceElementId);
        const result = job.resultAssets[0];
        if (source?.type === "image" && result) {
          updateElement(source.id, {
            src: result.url,
            assetId: result.id,
            name: `${source.name} AI編集`,
          });
          setMessage("編集結果を選択画像へ反映しました");
          return;
        }
      }

      const threeUp = job.resultAssets.length === 3;
      job.resultAssets.forEach((asset, index) => {
        addElement({
          id: crypto.randomUUID(),
          type: "image",
          name: `AI生成 ${index + 1}`,
          x: threeUp ? 38 + index * 408 : 680,
          y: threeUp ? 420 : 330,
          width: threeUp ? 380 : 520,
          height: threeUp ? 199 : 272,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          src: asset.url,
          assetId: asset.id,
        });
      });
      setMessage(`${job.resultAssets.length}案をキャンバスへ追加しました`);
    },
    [addElement, updateElement],
  );

  useEffect(() => {
    for (const job of jobs) {
      if (job.status === "succeeded" && pendingPlacement.current.has(job.id)) {
        pendingPlacement.current.delete(job.id);
        placeJob(job);
      }
      if (["failed", "cancelled"].includes(job.status)) {
        pendingPlacement.current.delete(job.id);
      }
    }
  }, [jobs, placeJob]);

  const submit = async () => {
    setMessage(null);
    if (prompt.trim().length < 3) {
      setMessage("生成指示を3文字以上入力してください");
      return;
    }
    if (mode === "edit" && !selectedImage?.assetId) {
      setMessage("アップロード画像またはAI生成画像を選択してください");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: mode,
          prompt: prompt.trim(),
          count: mode === "edit" ? 1 : count,
          modelTier,
          aspectRatio: "16:9",
          sourceAssetId: mode === "edit" ? selectedImage?.assetId : undefined,
          sourceElementId: mode === "edit" ? selectedImage?.id : undefined,
        }),
      });
      const result = (await response.json()) as GenerationJob & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "生成を開始できませんでした");
      pendingPlacement.current.add(result.id);
      setJobs((current) => [result, ...current.filter((job) => job.id !== result.id)]);
      setMessage(mode === "edit" ? "画像編集を開始しました" : `${count}案の生成を開始しました`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生成を開始できませんでした");
    } finally {
      setSubmitting(false);
    }
  };

  const jobAction = async (job: GenerationJob, action: "cancel" | "retry") => {
    setMessage(null);
    const response = await fetch(`/api/generations/${job.id}/${action}`, { method: "POST" });
    const result = (await response.json()) as GenerationJob & { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "操作に失敗しました");
      return;
    }
    if (action === "retry") pendingPlacement.current.add(result.id);
    await fetchJobs();
  };

  return (
    <section className="generation-panel">
      <div className="generation-heading-row">
        <div>
          <h3>AI画像スタジオ</h3>
          <span className={`provider-badge ${providerMode}`}>
            {providerMode === "gemini" ? "Nano Banana" : "Preview mode"}
          </span>
        </div>
        <Sparkles size={17} />
      </div>

      <div className="generation-mode-tabs" role="tablist" aria-label="画像AIモード">
        <button type="button" className={mode === "generate" ? "active" : ""} onClick={() => setMode("generate")}>
          <ImagePlus size={14} />生成
        </button>
        <button type="button" className={mode === "edit" ? "active" : ""} onClick={() => setMode("edit")}>
          <WandSparkles size={14} />編集
        </button>
      </div>

      {mode === "edit" ? (
        <div className={`selected-image-note ${selectedImage?.assetId ? "ready" : ""}`}>
          {selectedImage?.assetId ? `選択中: ${selectedImage.name}` : "編集する画像をキャンバスで選択"}
        </div>
      ) : null}

      <label className="generation-field">
        <span>{mode === "edit" ? "変更内容" : "つくりたい画像"}</span>
        <textarea
          rows={4}
          value={prompt}
          placeholder={mode === "edit" ? "例：背景を深いブルーに変更" : "例：静かな朝、机とノート、柔らかな自然光"}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>

      <div className="generation-options">
        <label>
          <span>モデル</span>
          <select value={modelTier} onChange={(event) => setModelTier(event.target.value as ImageModelTier)}>
            <option value="draft">Draft</option>
            <option value="default">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </label>
        {mode === "generate" ? (
          <div className="variation-picker">
            <span>案数</span>
            <div>
              <button type="button" className={count === 1 ? "active" : ""} onClick={() => setCount(1)}>1</button>
              <button type="button" className={count === 3 ? "active" : ""} onClick={() => setCount(3)}>3</button>
            </div>
          </div>
        ) : null}
      </div>

      <button type="button" className="generate-button" disabled={submitting} onClick={submit}>
        {submitting ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
        {submitting ? "受付中…" : mode === "edit" ? "選択画像を編集" : `${count}案を生成`}
      </button>
      {providerMode === "mock" ? <p className="provider-note">GEMINI_API_KEYを設定すると実モデルへ切り替わります。</p> : null}
      {message ? <p className="generation-message" role="status">{message}</p> : null}

      {jobs.length ? (
        <div className="generation-history">
          <h3>生成履歴</h3>
          {jobs.slice(0, 8).map((job) => (
            <article key={job.id} className={`generation-job ${job.status}`}>
              <div className="job-status-row">
                <span>
                  {job.status === "succeeded" ? <CheckCircle2 size={13} /> : job.status === "failed" ? <AlertCircle size={13} /> : job.status === "cancelled" ? <XCircle size={13} /> : job.status === "running" ? <LoaderCircle size={13} className="spin" /> : <Clock3 size={13} />}
                  {statusLabel[job.status]}
                </span>
                <small>{job.provider === "mock" ? "Preview" : job.model}</small>
              </div>
              <p>{job.prompt}</p>
              {job.status === "running" || job.status === "queued" ? (
                <div className="job-progress"><span style={{ width: `${Math.max(4, job.progress)}%` }} /></div>
              ) : null}
              {job.error ? <p className="job-error">{job.error}</p> : null}
              {job.resultAssets.length ? (
                <div className="job-results">
                  {job.resultAssets.map((asset) => (
                    <Image key={asset.id} src={asset.url} alt={asset.name} width={112} height={59} unoptimized />
                  ))}
                </div>
              ) : null}
              <div className="job-actions">
                {job.status === "succeeded" ? <button type="button" onClick={() => placeJob(job)}><Plus size={12} />追加</button> : null}
                {["failed", "cancelled"].includes(job.status) ? <button type="button" onClick={() => jobAction(job, "retry")}><RefreshCw size={12} />再試行</button> : null}
                {["queued", "running"].includes(job.status) ? <button type="button" onClick={() => jobAction(job, "cancel")}><XCircle size={12} />中止</button> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
