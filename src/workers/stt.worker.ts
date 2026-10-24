import { env, pipeline } from "@xenova/transformers";

type WhisperPipeline = Awaited<ReturnType<typeof pipeline>>;

let transcriber: WhisperPipeline | null = null;
let loading: Promise<WhisperPipeline> | null = null;
let loadedModelId: string | null = null;

env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

function formatProgress(data: {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}): string {
  if (data.status === "progress" && data.file) {
    if (typeof data.progress === "number") {
      return `Downloading ${data.file} (${Math.round(data.progress)}%)`;
    }
    if (data.loaded && data.total) {
      const pct = Math.round((data.loaded / data.total) * 100);
      return `Downloading ${data.file} (${pct}%)`;
    }
    return `Downloading ${data.file}…`;
  }
  if (data.status === "done" && data.file) return `Loaded ${data.file}`;
  if (data.status === "initiate" && data.file) return `Preparing ${data.file}…`;
  return data.status ?? "Loading model…";
}

async function loadModel(modelId: string): Promise<WhisperPipeline> {
  if (transcriber && loadedModelId === modelId) return transcriber;

  transcriber = null;
  loading = null;
  loadedModelId = null;

  loading = pipeline("automatic-speech-recognition", modelId, {
    progress_callback: (data: {
      status?: string;
      file?: string;
      progress?: number;
      loaded?: number;
      total?: number;
    }) => {
      self.postMessage({ type: "loading", status: formatProgress(data) });
    },
  }).then((p) => {
    transcriber = p;
    loadedModelId = modelId;
    return p;
  });
  return loading;
}

self.onmessage = async (
  event: MessageEvent<{ type: string; model?: string; audio?: Float32Array }>,
) => {
  const { type, model, audio } = event.data;

  if (type === "load" && model) {
    try {
      await loadModel(model);
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Model load failed",
      });
    }
    return;
  }

  if (type === "transcribe" && audio) {
    if (!transcriber) return;
    try {
      const transcribe = transcriber as (
        input: Float32Array,
        options: Record<string, unknown>,
      ) => Promise<{ text?: string }>;
      const result = await transcribe(new Float32Array(audio), {
        chunk_length_s: 5,
        stride_length_s: 1,
        return_timestamps: false,
        language: "english",
        task: "transcribe",
      } as Record<string, unknown>);
      const text =
        typeof result === "object" && result && "text" in result ? String(result.text) : "";
      if (text.trim()) self.postMessage({ type: "transcript", text: text.trim() });
    } catch (error) {
      self.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Transcription failed",
      });
    }
  }
};

self.addEventListener("unhandledrejection", (event) => {
  self.postMessage({
    type: "error",
    message: event.reason instanceof Error ? event.reason.message : "Whisper worker error",
  });
});
