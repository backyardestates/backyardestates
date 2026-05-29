"use client";

import { useCallback, useRef, useState } from "react";

interface Options {
    /** Called with each finalized utterance (append to the transcript). */
    onFinal: (text: string) => void;
    /** Called with the in-progress utterance (show as a live preview line). */
    onInterim: (text: string) => void;
}

interface DeepgramMessage {
    type?: string;
    is_final?: boolean;
    channel?: { alternatives?: { transcript?: string }[] };
}

/**
 * Live speech-to-text via Deepgram's streaming WebSocket. The browser fetches a
 * short-lived token from /api/consultations/stt-token (the API key stays on the
 * server), opens a WS to Deepgram, and streams mic audio as webm/opus chunks.
 * Interim results stream in as you speak; finalized utterances are committed.
 */
export function useLiveTranscription({ onFinal, onInterim }: Options) {
    const [recording, setRecording] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const supported =
        typeof window !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined";

    const teardown = useCallback(() => {
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
        }
        const rec = recorderRef.current;
        recorderRef.current = null;
        try {
            if (rec && rec.state !== "inactive") rec.stop();
        } catch {
            /* ignore */
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const ws = wsRef.current;
        wsRef.current = null;
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify({ type: "CloseStream" }));
            } catch {
                /* ignore */
            }
        }
        try {
            ws?.close();
        } catch {
            /* ignore */
        }
    }, []);

    const stop = useCallback(() => {
        teardown();
        setRecording(false);
        setConnecting(false);
    }, [teardown]);

    const start = useCallback(async () => {
        setError(null);
        if (!supported) {
            setError("Live dictation isn't supported in this browser.");
            return;
        }
        setConnecting(true);

        let token: string;
        try {
            const res = await fetch("/api/consultations/stt-token", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not start transcription.");
            token = data.token;
        } catch (err) {
            setConnecting(false);
            setError(err instanceof Error ? err.message : String(err));
            return;
        }

        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            setConnecting(false);
            setError("Couldn't access the microphone. Check browser permissions.");
            return;
        }
        streamRef.current = stream;

        const params = new URLSearchParams({
            model: "nova-3",
            smart_format: "true",
            punctuate: "true",
            interim_results: "true",
        });
        // Short-lived grant tokens authenticate with Bearer (API keys use
        // "token"); the wrong scheme makes the WS handshake fail.
        const ws = new WebSocket(
            `wss://api.deepgram.com/v1/listen?${params.toString()}`,
            ["bearer", token],
        );
        wsRef.current = ws;

        ws.onopen = () => {
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";
            const rec = new MediaRecorder(stream, { mimeType });
            recorderRef.current = rec;
            rec.ondataavailable = (e) => {
                if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data);
            };
            rec.start(250);
            setConnecting(false);
            setRecording(true);
            // Deepgram closes idle sockets after ~10s; keep it alive during pauses.
            keepAliveRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "KeepAlive" }));
                }
            }, 8000);
        };

        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data as string) as DeepgramMessage;
                const text = msg.channel?.alternatives?.[0]?.transcript ?? "";
                if (!text) return;
                if (msg.is_final) onFinal(text);
                else onInterim(text);
            } catch {
                /* non-JSON keepalive/metadata frame — ignore */
            }
        };

        ws.onerror = () => {
            setError("Live transcription connection error.");
        };
    }, [supported, onFinal, onInterim]);

    return { recording, connecting, error, supported, start, stop };
}
