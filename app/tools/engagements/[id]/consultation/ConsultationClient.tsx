"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveTranscription } from "./useLiveTranscription";
import s from "../../engagements.module.css";

type CaptureMode = "live" | "upload" | "paste";
type Step = "capture" | "review" | "sent";
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ActionItem {
    task: string;
    owner: string;
    priority: string;
}
interface MarketingAction {
    title: string;
    detail: string;
    channel: string;
}
interface Analysis {
    summary: string;
    bulletPoints: string[];
    actionItems: ActionItem[];
    sentiment: { overall: string; rationale: string };
    intent: { readiness: string; primaryMotivation: string; concerns: string[] };
    nextStepsEmail: { subject: string; body: string };
    marketingActions: MarketingAction[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ConsultationClient({
    engagementId,
    customerName: _customerName,
    customerEmail,
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

    const [step, setStep] = useState<Step>("capture");
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

    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [recipientEmail, setRecipientEmail] = useState(customerEmail ?? "");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");

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
        if (step !== "capture") return;
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

    // ── Generate (separate step — transcript is already saved) ────
    async function generate() {
        setError(null);
        if (transcript.trim().length < 20) {
            setError("Capture a bit more of the conversation before generating notes.");
            return;
        }
        if (live.recording) stopLive();
        setBusy(true);
        try {
            // Ensure the latest text is persisted before we spend AI on it.
            setBusyLabel("Saving transcript…");
            const id = await saveNow(transcript);

            setBusyLabel("Generating notes with AI…");
            const aRes = await fetch(`/api/consultations/${id}/analyze`, { method: "POST" });
            const aData = await aRes.json();
            if (!aRes.ok) throw new Error(aData.error || "Analysis failed");

            const a: Analysis = aData.analysis;
            setAnalysis(a);
            setEmailSubject(a.nextStepsEmail.subject);
            setEmailBody(a.nextStepsEmail.body);
            setStep("review");
        } catch (err) {
            // Transcript stays saved (server + localStorage) — just retry.
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function sendEmail() {
        const id = consultationIdRef.current;
        if (!id) return;
        const to = recipientEmail.trim();
        if (!EMAIL_RE.test(to)) {
            setError("Enter a valid recipient email before sending.");
            return;
        }
        setError(null);
        setBusy(true);
        setBusyLabel("Sending email…");
        try {
            const res = await fetch(`/api/consultations/${id}/send-next-steps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to, subject: emailSubject, body: emailBody }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send email");
            try {
                window.localStorage.removeItem(lsKey);
            } catch {
                /* ignore */
            }
            setStep("sent");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    // ── Render ────────────────────────────────────────────────
    if (step === "sent") {
        return (
            <section className={s.panel}>
                <p className={s.success}>Next-steps email sent.</p>
                <p className={s.rowMuted} style={{ margin: "8px 0 16px" }}>
                    The engagement has advanced to “Next-steps email sent”.
                </p>
                <Link className={s.primaryAction} href={`/tools/engagements/${engagementId}`}>
                    Back to engagement
                </Link>
            </section>
        );
    }

    if (step === "review" && analysis) {
        const emailValid = EMAIL_RE.test(recipientEmail.trim());
        return (
            <div>
                <section className={s.panel}>
                    <h2 className={s.panelTitle}>Summary</h2>
                    <p style={{ fontSize: 14, margin: 0 }}>{analysis.summary}</p>

                    <h2 className={s.panelTitle} style={{ marginTop: 16 }}>Key points</h2>
                    <ul className={s.aiList}>
                        {analysis.bulletPoints.map((b, i) => (
                            <li key={i}>{b}</li>
                        ))}
                    </ul>

                    <h2 className={s.panelTitle}>Action items</h2>
                    <ul className={s.aiList}>
                        {analysis.actionItems.map((a, i) => (
                            <li key={i}>
                                {a.task} <span className={s.metaPill}>{a.owner}</span>{" "}
                                <span className={s.metaPill}>{a.priority}</span>
                            </li>
                        ))}
                    </ul>

                    <h2 className={s.panelTitle}>Read</h2>
                    <div className={s.pillRow}>
                        <span className={s.metaPill}>sentiment: {analysis.sentiment.overall}</span>
                        <span className={s.metaPill}>readiness: {analysis.intent.readiness}</span>
                        <span className={s.metaPill}>{analysis.intent.primaryMotivation}</span>
                    </div>
                    {analysis.intent.concerns.length > 0 && (
                        <p className={s.rowMuted}>Concerns: {analysis.intent.concerns.join("; ")}</p>
                    )}
                </section>

                <section className={s.panel}>
                    <h2 className={s.panelTitle}>Next-steps email (review &amp; edit before sending)</h2>
                    <div className={s.field}>
                        <label className={s.label}>To</label>
                        <input
                            className={s.input}
                            type="email"
                            placeholder="customer@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                        {!customerEmail && (
                            <p className={s.rowMuted} style={{ marginTop: 6 }}>
                                No email was on file for this engagement — enter one to send. It’ll
                                be saved to the engagement for next time.
                            </p>
                        )}
                        {recipientEmail.trim() && !emailValid && (
                            <p className={s.error}>That doesn’t look like a valid email address.</p>
                        )}
                    </div>
                    <div className={s.field}>
                        <label className={s.label}>Subject</label>
                        <input
                            className={s.input}
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                        />
                    </div>
                    <div className={s.field}>
                        <label className={s.label}>Body</label>
                        <textarea
                            className={s.textarea}
                            style={{ minHeight: 220 }}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                        />
                    </div>
                    <button
                        className={s.primaryAction}
                        onClick={sendEmail}
                        disabled={busy || !emailValid}
                    >
                        {busy ? busyLabel || "Sending…" : "Send next-steps email"}
                    </button>
                    {error && <p className={s.error}>{error}</p>}
                </section>

                <section className={s.panel}>
                    <h2 className={s.panelTitle}>Marketing follow-up ideas</h2>
                    {analysis.marketingActions.map((m, i) => (
                        <div key={i} className={s.mktCard}>
                            <div>
                                <span className={s.mktTitle}>{m.title}</span>
                                <span className={s.mktChannel}>{m.channel}</span>
                            </div>
                            <div className={s.mktDetail}>{m.detail}</div>
                        </div>
                    ))}
                </section>
            </div>
        );
    }

    // step === "capture"
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
