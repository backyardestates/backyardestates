"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../../detail.module.css";

// ── Edit & (re)send the next-steps email ──────────────────────────────────────
export function EmailSender({
    consultationId,
    hasEmail,
    alreadySent,
    initialSubject,
    initialBody,
}: {
    consultationId: string;
    hasEmail: boolean;
    alreadySent: boolean;
    initialSubject: string;
    initialBody: string;
}) {
    const router = useRouter();
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sentNow, setSentNow] = useState(false);

    async function send() {
        setError(null);
        setSentNow(false);
        if (!subject.trim() || !body.trim()) {
            setError("Subject and body are required.");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(
                `/api/consultations/${consultationId}/send-next-steps`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subject, body }),
                },
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send email");
            setSentNow(true);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    const label = alreadySent ? "Resend email" : "Send next-steps email";

    return (
        <section className={s.panel}>
            <div className={s.panelHead}>
                <h2 className={s.panelTitle}>Next-steps email</h2>
            </div>
            {!hasEmail && (
                <p className={s.error}>
                    This engagement has no customer email on file — add one in Pipedrive to send.
                </p>
            )}
            <div className={s.field}>
                <label className={s.label}>Subject</label>
                <input
                    className={s.input}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={busy}
                />
            </div>
            <div className={s.field}>
                <label className={s.label}>Body</label>
                <textarea
                    className={s.textarea}
                    style={{ minHeight: 220 }}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={busy}
                />
            </div>
            <button className={s.primaryAction} onClick={send} disabled={busy || !hasEmail}>
                {busy ? "Sending…" : label}
            </button>
            {sentNow && <p className={s.success}>Email sent.</p>}
            {error && <p className={s.error}>{error}</p>}
        </section>
    );
}

// ── Ask the meeting transcript ─────────────────────────────────────────────────
export function AskBox({ consultationId }: { consultationId: string }) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function ask() {
        const q = question.trim();
        if (!q) return;
        setError(null);
        setAnswer(null);
        setBusy(true);
        try {
            const res = await fetch(`/api/consultations/${consultationId}/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to get an answer");
            setAnswer(data.answer);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className={s.panel}>
            <div className={s.panelHead}>
                <h2 className={s.panelTitle}>Ask about this meeting</h2>
            </div>
            <p className={s.rowMuted} style={{ margin: "0 0 12px" }}>
                Search the full transcript for anything the summary didn&apos;t capture — budget,
                timeline, objections, who said what.
            </p>
            <div className={s.field}>
                <textarea
                    className={s.textarea}
                    placeholder="e.g. Did they mention a target move-in date? What was their budget range?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask();
                    }}
                    disabled={busy}
                />
            </div>
            <button
                className={s.primaryAction}
                onClick={ask}
                disabled={busy || question.trim().length === 0}
            >
                {busy ? "Searching transcript…" : "Ask"}
            </button>
            {answer && <div className={s.answerBox}>{answer}</div>}
            {error && <p className={s.error}>{error}</p>}
        </section>
    );
}
