"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveTranscription } from "./useLiveTranscription";
import s from "../../engagements.module.css";

type CaptureMode = "live" | "upload" | "paste";
type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ConsultationClient({
    engagementId,
    customerName: _customerName,
    customerEmail: _customerEmail,
    existingConsultationId,
    existingTranscript,
}: {
    engagementId: string;
    customerName: string | null;
    customerEmail: string | null;
    existingConsultationId: string | null;
    existingTranscript: string | null;
}) {
    const router = useRouter();
    const lsKey = `consultation:transcript:${engagementId}`;

    const [mode, setMode] = useState<CaptureMode>("live");
    const [consent, setConsent] = useState(false);

    // The single source of truth for captured text. Live dictation, audio
    // upload, and paste all write here; it stays directly editable.
    const [transcript, setTranscript] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const local = window.localStorage.getItem(lsKey);
            // Prefer a local backup (may hold unsaved edits) over the server copy.
            if (local && local.trim()) return local;
        }
        return existingTranscript ?? "";
    });
    const [interim, setInterim] = useState("");

    const [saveStatus, setSaveStatus] = useState<SaveStatus>(
        existingTranscript ? "saved" : "idle",
    );
    const [busy, setBusy] = useState(false);
    const [busyLabel, setBusyLabel] = useState("");
    const [error, setError] = useState<string | null>(null);

    const consultationIdRef = useRef<string | null>(existingConsultationId);
    const createPromiseRef = useRef<Promise<string> | null>(null);
    const lastSavedRef = useRef<string>(existingTranscript ?? "");

    // ── Persistence ───────────────────────────────────────────────
    // Create the consultation row lazily (on the first save / audio upload /
    // dictation), deduped so concurrent callers share one create.
    async function ensureConsultation(): Promise<string> {
        if (consultationIdRef.current) return consultationIdRef.current;
        if (createPromiseRef.current) return createPromiseRef.current;
        const p = (async () => {
            const res = await fetch(`/api/engagements/${engagementId}/consultations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source:
                        mode === "paste" ? "PASTED" : mode === "upload" ? "UPLOADED" : "RECORDED",
                    consentGiven: mode === "paste" ? true : consent,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create consultation");
            consultationIdRef.current = data.consultation.id as string;
            return consultationIdRef.current;
        })();
        createPromiseRef.current = p;
        try {
            return await p;
        } finally {
            createPromiseRef.current = null;
        }
    }

    async function saveNow(text: string): Promise<string> {
        setSaveStatus("saving");
        try {
            const id = await ensureConsultation();
            const res = await fetch(`/api/consultations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: text }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save transcript");
            lastSavedRef.current = text;
            setSaveStatus("saved");
            return id;
        } catch (err) {
            setSaveStatus("error");
            throw err;
        }
    }

    // Mirror to localStorage immediately (survives crashes / network loss), and
    // debounce a server save so the transcript persists without an explicit tap.
    useEffect(() => {
        try {
            if (transcript) window.localStorage.setItem(lsKey, transcript);
            else window.localStorage.removeItem(lsKey);
        } catch {
            /* quota / private mode — ignore, server save still runs */
        }
        if (!transcript.trim()) return;
        if (transcript === lastSavedRef.current) return;
        const t = setTimeout(() => {
            void saveNow(transcript).catch(() => {
                /* status already set to "error"; localStorage holds the text */
            });
        }, 1500);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript]);

    // ── Live dictation ───────────────────────────────────────────
    const live = useLiveTranscription({
        onFinal: (seg) => {
            setTranscript((prev) => prev + (prev && !/\s$/.test(prev) ? " " : "") + seg);
            setInterim("");
        },
        onInterim: (seg) => setInterim(seg),
    });

    function startLive() {
        if (!consent) {
            setError("Confirm recording consent before dictating.");
            return;
        }
        setError(null);
        void live.start();
    }

    function stopLive() {
        live.stop();
        setInterim("");
    }

    // ── Audio upload (batch transcription fills the same field) ───
    async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!consent) {
            setError("Confirm recording consent before uploading audio.");
            return;
        }
        setError(null);
        setBusy(true);
        setBusyLabel("Transcribing audio…");
        try {
            const id = await ensureConsultation();
            const fd = new FormData();
            fd.append("audio", f, f.name);
            const res = await fetch(`/api/consultations/${id}/transcribe`, {
                method: "POST",
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Transcription failed");
            const text: string = data.consultation?.transcript ?? "";
            // Append to anything already captured; the autosave effect persists
            // the combined transcript.
            setTranscript((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    // ── Generate notes ────────────────────────────────────────────
    // Persists the transcript, runs the AI analysis (which the API writes onto
    // the consultation), then hands off to the canonical consultation detail
    // page — the same view opened from the engagement — to review notes and
    // send the next-steps email. No duplicate review UI lives here.
    async function generate() {
        setError(null);
        if (transcript.trim().length < 20) {
            setError("Capture a bit more of the conversation before generating notes.");
            return;
        }
        if (live.recording) stopLive();
        setBusy(true);
        // Track which step fails so a surfaced error tells us client vs server
        // and exactly where (save vs analyze vs navigate).
        let stage = "init";
        try {
            stage = "save";
            setBusyLabel("Saving transcript…");
            const id = await saveNow(transcript);

            stage = "analyze";
            setBusyLabel("Generating notes with AI…");
            const aRes = await fetch(`/api/consultations/${id}/analyze`, { method: "POST" });
            // Read as text first. A timed-out / crashed serverless function
            // returns a non-JSON error page; calling .json() on that throws an
            // opaque "SyntaxError" instead of telling us what actually happened.
            const aText = await aRes.text();
            let aData: { error?: string } = {};
            if (aText) {
                try {
                    aData = JSON.parse(aText);
                } catch {
                    throw new Error(
                        `Server returned a non-JSON response (HTTP ${aRes.status}). ${
                            aText.slice(0, 200) || "(empty body)"
                        }`,
                    );
                }
            }
            if (!aRes.ok) throw new Error(aData.error || `Analysis failed (HTTP ${aRes.status})`);

            stage = "navigate";
            // Notes are persisted on the consultation — clear the local draft and
            // open the detail page to review + send.
            try {
                window.localStorage.removeItem(lsKey);
            } catch {
                /* ignore */
            }
            router.push(`/tools/engagements/${engagementId}/consultations/${id}`);
            router.refresh();
        } catch (err) {
            // Transcript stays saved (server + localStorage) — just retry.
            const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
            setError(`[gen:${stage}] ${detail}`);
            setBusy(false);
            setBusyLabel("");
        }
    }

    // ── Render (capture only) ─────────────────────────────────────
    const saveText =
        saveStatus === "saving"
            ? "Saving…"
            : saveStatus === "saved"
              ? "Saved ✓"
              : saveStatus === "error"
                ? "Save failed — kept on this device, will retry"
                : "Not saved yet";

    return (
        <section className={s.panel}>
            <h2 className={s.panelTitle}>Capture the consultation</h2>
            <div className={s.tabs}>
                {(["live", "upload", "paste"] as CaptureMode[]).map((m) => (
                    <button
                        key={m}
                        className={`${s.tab} ${mode === m ? s.tabActive : ""}`}
                        onClick={() => setMode(m)}
                        disabled={busy || live.recording}
                    >
                        {m === "live"
                            ? "Live dictation"
                            : m === "upload"
                              ? "Upload audio"
                              : "Paste transcript"}
                    </button>
                ))}
            </div>

            {mode === "live" && (
                <div className={s.field}>
                    {live.recording ? (
                        <button className={s.btnGhost} onClick={stopLive}>
                            <span className={s.recDot} />
                            Stop dictation
                        </button>
                    ) : (
                        <button
                            className={s.btnGhost}
                            onClick={startLive}
                            disabled={busy || live.connecting || !live.supported}
                        >
                            {live.connecting ? "Connecting…" : "Start dictation"}
                        </button>
                    )}
                    {live.recording && (
                        <span className={s.rowMuted} style={{ marginLeft: 10 }}>
                            Listening — speak naturally
                        </span>
                    )}
                    {!live.supported && (
                        <p className={s.rowMuted} style={{ marginTop: 6 }}>
                            Live dictation needs microphone support — use Upload audio or Paste
                            instead.
                        </p>
                    )}
                    {live.error && <p className={s.error}>{live.error}</p>}
                </div>
            )}

            {mode === "upload" && (
                <div className={s.field}>
                    <input type="file" accept="audio/*" onChange={onUpload} disabled={busy} />
                </div>
            )}

            {(mode === "live" || mode === "upload") && (
                <label className={s.consentRow}>
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        disabled={live.recording}
                    />
                    <span>
                        I confirm everyone present consented to this meeting being recorded
                        (California is a two-party-consent state).
                    </span>
                </label>
            )}

            <div className={s.field}>
                <label className={s.label}>Transcript</label>
                <textarea
                    className={s.textarea}
                    style={{ minHeight: 220 }}
                    placeholder={
                        mode === "paste"
                            ? "Paste the meeting transcript (from Otter, Fireflies, Zoom, etc.)…"
                            : "Your words appear here as you speak — edit freely before generating notes."
                    }
                    value={interim ? `${transcript}${transcript ? " " : ""}${interim}` : transcript}
                    onChange={(e) => {
                        setInterim("");
                        setTranscript(e.target.value);
                    }}
                    disabled={busy}
                />
                <div
                    className={s.rowMuted}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 6,
                    }}
                >
                    <span className={saveStatus === "error" ? s.error : undefined}>{saveText}</span>
                    <button
                        type="button"
                        className={s.btnGhost}
                        onClick={() => void saveNow(transcript).catch(() => {})}
                        disabled={busy || !transcript.trim() || saveStatus === "saving"}
                    >
                        Save transcript
                    </button>
                </div>
            </div>

            <button
                className={s.primaryAction}
                onClick={generate}
                disabled={busy || transcript.trim().length < 20}
            >
                {busy ? busyLabel || "Working…" : "Generate notes & email"}
            </button>
            {error && <p className={s.error}>{error}</p>}
        </section>
    );
}
