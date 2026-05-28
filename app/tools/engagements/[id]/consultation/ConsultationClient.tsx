"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "../../engagements.module.css";

type CaptureMode = "record" | "upload" | "paste";
type Step = "capture" | "review" | "sent";

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

export function ConsultationClient({
    engagementId,
    customerName,
    hasEmail,
}: {
    engagementId: string;
    customerName: string | null;
    hasEmail: boolean;
}) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("capture");
    const [mode, setMode] = useState<CaptureMode>("record");
    const [consent, setConsent] = useState(false);
    const [pasted, setPasted] = useState("");
    const [recording, setRecording] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [busyLabel, setBusyLabel] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");

    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioBlobRef = useRef<Blob | null>(null);
    const sentRef = useRef<string | null>(null);

    async function startRecording() {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const rec = new MediaRecorder(stream);
            chunksRef.current = [];
            rec.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            rec.onstop = () => {
                audioBlobRef.current = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioReady(true);
                stream.getTracks().forEach((t) => t.stop());
            };
            rec.start();
            recorderRef.current = rec;
            setRecording(true);
            setAudioReady(false);
        } catch {
            setError("Couldn't access the microphone. Check browser permissions.");
        }
    }

    function stopRecording() {
        recorderRef.current?.stop();
        setRecording(false);
    }

    function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) {
            audioBlobRef.current = f;
            setAudioReady(true);
        }
    }

    async function generate() {
        setError(null);
        const usingAudio = mode === "record" || mode === "upload";
        if (usingAudio && !consent) {
            setError("Please confirm recording consent before generating notes.");
            return;
        }
        if (usingAudio && !audioBlobRef.current) {
            setError("Record or upload audio first.");
            return;
        }
        if (mode === "paste" && pasted.trim().length < 20) {
            setError("Paste the meeting transcript first.");
            return;
        }

        setBusy(true);
        try {
            // 1. Create the consultation.
            setBusyLabel("Saving consultation…");
            const createRes = await fetch(
                `/api/engagements/${engagementId}/consultations`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source: mode === "paste" ? "PASTED" : mode === "upload" ? "UPLOADED" : "RECORDED",
                        consentGiven: usingAudio ? consent : true,
                        transcript: mode === "paste" ? pasted.trim() : undefined,
                    }),
                },
            );
            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error || "Failed to create consultation");
            const consultationId: string = createData.consultation.id;

            // 2. Transcribe audio if needed.
            if (usingAudio && audioBlobRef.current) {
                setBusyLabel("Transcribing audio…");
                const fd = new FormData();
                fd.append(
                    "audio",
                    new File([audioBlobRef.current], "consultation.webm", {
                        type: audioBlobRef.current.type || "audio/webm",
                    }),
                );
                const tRes = await fetch(`/api/consultations/${consultationId}/transcribe`, {
                    method: "POST",
                    body: fd,
                });
                const tData = await tRes.json();
                if (!tRes.ok) throw new Error(tData.error || "Transcription failed");
            }

            // 3. Analyze.
            setBusyLabel("Generating notes with AI…");
            const aRes = await fetch(`/api/consultations/${consultationId}/analyze`, {
                method: "POST",
            });
            const aData = await aRes.json();
            if (!aRes.ok) throw new Error(aData.error || "Analysis failed");

            const a: Analysis = aData.analysis;
            setAnalysis(a);
            setEmailSubject(a.nextStepsEmail.subject);
            setEmailBody(a.nextStepsEmail.body);
            // Stash the id for sending.
            sentRef.current = consultationId;
            setStep("review");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function sendEmail() {
        if (!sentRef.current) return;
        setError(null);
        setBusy(true);
        setBusyLabel("Sending email…");
        try {
            const res = await fetch(`/api/consultations/${sentRef.current}/send-next-steps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject: emailSubject, body: emailBody }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send email");
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
                    {!hasEmail && (
                        <p className={s.error}>
                            This engagement has no customer email on file — add one in Pipedrive to send.
                        </p>
                    )}
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
                        disabled={busy || !hasEmail}
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
    return (
        <section className={s.panel}>
            <h2 className={s.panelTitle}>Capture the consultation</h2>
            <div className={s.tabs}>
                {(["record", "upload", "paste"] as CaptureMode[]).map((m) => (
                    <button
                        key={m}
                        className={`${s.tab} ${mode === m ? s.tabActive : ""}`}
                        onClick={() => setMode(m)}
                        disabled={busy || recording}
                    >
                        {m === "record" ? "Record" : m === "upload" ? "Upload audio" : "Paste transcript"}
                    </button>
                ))}
            </div>

            {mode === "record" && (
                <div className={s.field}>
                    {recording ? (
                        <button className={s.btnGhost} onClick={stopRecording}>
                            <span className={s.recDot} />Stop recording
                        </button>
                    ) : (
                        <button className={s.btnGhost} onClick={startRecording} disabled={busy}>
                            {audioReady ? "Re-record" : "Start recording"}
                        </button>
                    )}
                    {audioReady && !recording && (
                        <span className={s.rowMuted} style={{ marginLeft: 10 }}>
                            Audio captured ✓
                        </span>
                    )}
                </div>
            )}

            {mode === "upload" && (
                <div className={s.field}>
                    <input type="file" accept="audio/*" onChange={onUpload} disabled={busy} />
                    {audioReady && <span className={s.rowMuted} style={{ marginLeft: 10 }}>Ready ✓</span>}
                </div>
            )}

            {mode === "paste" && (
                <div className={s.field}>
                    <textarea
                        className={s.textarea}
                        placeholder="Paste the meeting transcript (from Otter, Fireflies, Zoom, etc.)…"
                        value={pasted}
                        onChange={(e) => setPasted(e.target.value)}
                        disabled={busy}
                    />
                </div>
            )}

            {(mode === "record" || mode === "upload") && (
                <label className={s.consentRow}>
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>
                        I confirm everyone present consented to this meeting being recorded
                        (California is a two-party-consent state).
                    </span>
                </label>
            )}

            <button className={s.primaryAction} onClick={generate} disabled={busy}>
                {busy ? busyLabel || "Working…" : "Generate notes & email"}
            </button>
            {error && <p className={s.error}>{error}</p>}
        </section>
    );
}
