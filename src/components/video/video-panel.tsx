"use client";

import {
  CheckCircle2,
  Download,
  Film,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditorStore } from "@/features/canvas/store";
import type {
  VideoGenerationKind,
  VideoJob,
  VideoJobListResponse,
} from "@/features/video/types";

const activeStatuses = new Set(["queued", "submitting", "running"]);

const statusLabel: Record<VideoJob["status"], string> = {
  queued: "待機中",
  submitting: "送信中",
  running: "生成中",
  succeeded: "完了",
  failed: "失敗",
  timed_out: "タイムアウト",
};

export function VideoPanel() {
  const selectedId = useEditorStore((state) => state.selectedId);
  const elements = useEditorStore((state) => state.scene.elements);
  const selectedImage = useMemo(() => {
    const element = elements.find((candidate) => candidate.id === selectedId);
    return element?.type === "image" ? element : undefined;
  }, [elements, selectedId]);
  const [kind, setKind] = useState<VideoGenerationKind>("image");
  const [prompt, setPrompt] = useState("被写体が自然に動き、カメラがゆっくり寄る");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [providerMode, setProviderMode] = useState<"seedance" | "mock">("mock");
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/videos");
    if (!response.ok) throw new Error("動画履歴を読み込めませんでした");
    const body = (await response.json()) as VideoJobListResponse;
    setProviderMode(body.providerMode);
    setJobs(body.jobs);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadJobs().catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "動画履歴を読み込めませんでした"),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  useEffect(() => {
    const activeIds = jobs.filter((job) => activeStatuses.has(job.status)).map((job) => job.id);
    if (!activeIds.length) return;
    const poll = async () => {
      const refreshed = await Promise.all(
        activeIds.map(async (id) => {
          const response = await fetch(`/api/videos/${id}`);
          return response.ok ? ((await response.json()) as VideoJob) : null;
        }),
      );
      setJobs((current) => current.map((job) => refreshed.find((item) => item?.id === job.id) ?? job));
    };
    const timer = window.setInterval(() => void poll(), 2_000);
    return () => window.clearInterval(timer);
  }, [jobs]);

  const create = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          prompt,
          sourceAssetId: kind === "image" ? selectedImage?.assetId : undefined,
          sourceElementId: kind === "image" ? selectedImage?.id : undefined,
          duration,
          aspectRatio,
          resolution,
          generateAudio,
        }),
      });
      const body = (await response.json()) as VideoJob & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "動画生成を開始できませんでした");
      setJobs((current) => [body, ...current]);
      setMessage("動画生成を開始しました。画面を閉じても履歴から確認できます。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "動画生成を開始できませんでした");
    } finally {
      setSubmitting(false);
    }
  };

  const retry = async (id: string) => {
    setMessage(null);
    const response = await fetch(`/api/videos/${id}/retry`, { method: "POST" });
    const body = (await response.json()) as VideoJob & { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "再実行できませんでした");
      return;
    }
    setJobs((current) => [body, ...current]);
    setMessage("同じ設定で再実行しました。");
  };

  return (
    <div className="video-panel">
      <div className="video-heading">
        <div><Film size={15} /><strong>Seedance 動画</strong></div>
        <span className={`provider-badge ${providerMode}`}>{providerMode}</span>
      </div>
      <p className="video-description">テキストまたは選択画像からMP4を生成します。</p>

      <div className="generation-mode-tabs">
        <button type="button" className={kind === "image" ? "active" : ""} onClick={() => setKind("image")}>画像から</button>
        <button type="button" className={kind === "text" ? "active" : ""} onClick={() => setKind("text")}>テキストから</button>
      </div>
      {kind === "image" ? (
        <div className={`selected-image-note ${selectedImage?.assetId ? "ready" : ""}`}>
          {selectedImage?.assetId ? `選択中: ${selectedImage.name}` : "キャンバス上の保存済み画像を選択してください"}
        </div>
      ) : null}
      <label className="generation-field">
        動き・カメラ・雰囲気
        <textarea rows={3} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      </label>
      <div className="video-options">
        <label>秒数<select value={duration} onChange={(event) => setDuration(Number(event.target.value) as 5 | 10)}><option value={5}>5秒</option><option value={10}>10秒</option></select></label>
        <label>比率<select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as typeof aspectRatio)}><option>16:9</option><option>9:16</option><option>1:1</option></select></label>
        <label>画質<select value={resolution} onChange={(event) => setResolution(event.target.value as typeof resolution)}><option>720p</option><option>1080p</option></select></label>
      </div>
      <label className="video-audio"><input type="checkbox" checked={generateAudio} onChange={(event) => setGenerateAudio(event.target.checked)} />音声も生成する</label>
      <button className="video-generate-button" type="button" disabled={submitting || (kind === "image" && !selectedImage?.assetId)} onClick={create}>
        {submitting ? <LoaderCircle size={14} className="spin" /> : <Film size={14} />}
        {submitting ? "開始中" : "動画を生成"}
      </button>
      <p className="provider-note">{providerMode === "mock" ? "APIキー未設定のため、再生可能なサンプルMP4を作成します。" : "APIキーはサーバー内だけで使用されます。生成には数分かかる場合があります。"}</p>
      {message ? <p className="generation-message">{message}</p> : null}

      {jobs.length ? <div className="video-history">
        <h3>動画履歴</h3>
        {jobs.slice(0, 8).map((job) => (
          <article className={`video-job ${job.status}`} key={job.id}>
            <div className="job-status-row"><span>{activeStatuses.has(job.status) ? <LoaderCircle size={11} className="spin" /> : job.status === "succeeded" ? <CheckCircle2 size={11} /> : <TriangleAlert size={11} />}{statusLabel[job.status]}</span><small>{job.request.duration}秒 · {job.request.resolution}</small></div>
            <p>{job.prompt}</p>
            {activeStatuses.has(job.status) ? <div className="job-progress"><span style={{ width: `${job.progress}%` }} /></div> : null}
            {job.error ? <p className="job-error">{job.error}</p> : null}
            {job.resultUrl ? <video controls preload="metadata" src={job.resultUrl}>動画を再生できません。</video> : null}
            <div className="job-actions">
              {job.resultUrl ? <a href={job.resultUrl} download><Download size={10} />MP4</a> : null}
              {["failed", "timed_out"].includes(job.status) ? <button type="button" onClick={() => retry(job.id)}><RefreshCw size={10} />再実行</button> : null}
            </div>
          </article>
        ))}
      </div> : null}
    </div>
  );
}
