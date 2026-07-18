import "server-only";

import type { RemoteVideoResult, VideoProvider } from "./video-provider";
import { SEEDANCE_MODEL } from "./video-provider";

const DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

type SeedanceTaskResponse = {
  id?: string;
  status?: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  content?: { video_url?: string };
  error?: { code?: string; message?: string };
};

function apiError(response: Response, body: SeedanceTaskResponse) {
  return body.error?.message ?? body.error?.code ?? `Seedance API error (${response.status})`;
}

export function buildSeedancePrompt(input: {
  prompt: string;
  duration: number;
  aspectRatio: string;
  resolution: string;
  generateAudio: boolean;
}) {
  return [
    input.prompt.trim(),
    `--ratio ${input.aspectRatio}`,
    `--duration ${input.duration}`,
    `--resolution ${input.resolution}`,
    `--generate_audio ${input.generateAudio}`,
    "--watermark false",
  ].join(" ");
}

export class SeedanceVideoProvider implements VideoProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.SEEDANCE_API_KEY;
    if (!apiKey) throw new Error("SEEDANCE_API_KEYが設定されていません");
    this.apiKey = apiKey;
    this.baseUrl = (process.env.SEEDANCE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  private async request(path: string, init?: RequestInit) {
    const timeoutMs = Number(process.env.SEEDANCE_REQUEST_TIMEOUT_MS ?? 30_000);
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }

  async create(input: Parameters<VideoProvider["create"]>[0]) {
    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: buildSeedancePrompt(input.request),
      },
    ];
    if (input.source) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${input.source.mimeType};base64,${input.source.bytes.toString("base64")}`,
        },
      });
    }

    const response = await this.request("/contents/generations/tasks", {
      method: "POST",
      body: JSON.stringify({ model: SEEDANCE_MODEL, content }),
    });
    const body = (await response.json()) as SeedanceTaskResponse;
    if (!response.ok || !body.id) throw new Error(apiError(response, body));
    return { remoteJobId: body.id };
  }

  async get(remoteJobId: string): Promise<RemoteVideoResult> {
    const response = await this.request(
      `/contents/generations/tasks/${encodeURIComponent(remoteJobId)}`,
    );
    const body = (await response.json()) as SeedanceTaskResponse;
    if (!response.ok) throw new Error(apiError(response, body));
    if (body.status === "cancelled") {
      return { status: "failed", error: "Seedance側でタスクがキャンセルされました" };
    }
    if (!body.status) throw new Error("Seedanceから不正なタスク状態が返されました");
    return {
      status: body.status,
      videoUrl: body.content?.video_url,
      error: body.error?.message ?? body.error?.code,
    };
  }
}
