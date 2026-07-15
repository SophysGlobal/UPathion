import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RecorderState = "idle" | "requesting" | "recording" | "transcribing" | "error";

// Encode raw Float32 PCM chunks into a 16-bit mono WAV Blob.
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const samples = new Int16Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]));
      samples[offset++] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) view.setInt16(off, samples[i], true);
  return new Blob([buffer], { type: "audio/wav" });
}

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    try { nodeRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { void ctxRef.current?.close(); } catch {}
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    cancelledRef.current = false;
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      chunksRef.current = [];
      node.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(node);
      node.connect(ctx.destination);
      setState("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone access denied");
      setState("error");
      cleanup();
    }
  }, [cleanup]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    cleanup();
    setState("idle");
  }, [cleanup]);

  const stop = useCallback(async () => {
    if (state !== "recording" || !ctxRef.current) return;
    const sampleRate = ctxRef.current.sampleRate;
    const chunks = chunksRef.current;
    cleanup();
    if (cancelledRef.current) { setState("idle"); return; }
    const blob = encodeWav(chunks, sampleRate);
    if (blob.size < 2048) {
      setError("Recording was empty — please try again.");
      setState("error");
      return;
    }
    setState("transcribing");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Please sign in");
      const form = new FormData();
      form.append("file", blob, "recording.wav");
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: form,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || `Transcription failed (${resp.status})`);
      }
      const { text } = await resp.json();
      if (typeof text === "string" && text.trim()) onTranscript(text.trim());
      setState("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
      setState("error");
    }
  }, [state, cleanup, onTranscript]);

  const reset = useCallback(() => {
    setError(null);
    setState("idle");
  }, []);

  return { state, error, start, stop, cancel, reset };
}