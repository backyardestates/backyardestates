"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./DripManager.module.css";

type MsgStatus = "SCHEDULED" | "SENT" | "SKIPPED" | "FAILED";
type DripStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface DripMessageVM {
    id: string;
    stepIndex: number;
    subject: string;
    body: string;
    status: MsgStatus;
    scheduledFor: string; // ISO
    sentAt: string | null;
    contentTitle: string | null;
    attachments: { filename: string; url: string }[];
}

const ALLOWED_IMG = /^https:\/\/(res\.cloudinary\.com|cdn\.sanity\.io)\//i;

interface Props {
    engagementId: string;
    customerName: string | null;
    hasEmail: boolean;
    enrollmentId: string | null;
    enrollmentStatus: DripStatus | null;
    messages: DripMessageVM[];
}

function toLocalInput(iso: string): string {
    const d = new Date(iso);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

export function DripManagerClient({
    engagementId,
    customerName,
    hasEmail,
    enrollmentId,
    enrollmentStatus: initialStatus,
    messages,
}: Props) {
    const router = useRouter();
    const [status, setStatus] = useState<DripStatus | null>(initialStatus);
    const [headerBusy, setHeaderBusy] = useState(false);
    const [headerError, setHeaderError] = useState<string | null>(null);

    const scheduledCount = messages.filter((m) => m.status === "SCHEDULED").length;
    const sentCount = messages.filter((m) => m.status === "SENT").length;

    async function setEnrollment(next: "ACTIVE" | "PAUSED") {
        if (!enrollmentId) return;
        setHeaderBusy(true);
        setHeaderError(null);
        try {
            const res = await fetch(`/api/drip/enrollments/${enrollmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            setStatus(next);
        } catch (err) {
            setHeaderError(err instanceof Error ? err.message : String(err));
        } finally {
            setHeaderBusy(false);
        }
    }

    async function stopDrip() {
        if (!window.confirm("Stop this drip? Pending emails won't send. This can't be undone."))
            return;
        setHeaderBusy(true);
        setHeaderError(null);
        try {
            const res = await fetch(`/api/engagements/${engagementId}/drip/cancel`, {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to stop drip");
            }
            setStatus("CANCELLED");
            router.refresh();
        } catch (err) {
            setHeaderError(err instanceof Error ? err.message : String(err));
        } finally {
            setHeaderBusy(false);
        }
    }

    if (!enrollmentId || messages.length === 0) {
        return (
            <div className={s.shell}>
                <Link href={`/tools/engagements/${engagementId}`} className={s.backLink}>
                    ← Back to engagement
                </Link>
                <div className={s.empty}>
                    <p className={s.emptyTitle}>No follow-up drip yet</p>
                    <p className={s.emptyText}>
                        A content-matched drip is created automatically when the next-steps email is
                        sent after a consultation.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={s.shell}>
            <Link href={`/tools/engagements/${engagementId}`} className={s.backLink}>
                ← Back to engagement
            </Link>

            <header className={s.header}>
                <div>
                    <p className={s.eyebrow}>Follow-up drip</p>
                    <h1 className={s.title}>
                        {customerName || "Prospect"} <em>nurture</em>
                    </h1>
                    <p className={s.subtitle}>
                        {sentCount} sent · {scheduledCount} scheduled · {messages.length} total
                        {!hasEmail && " · no email on file — sends will be skipped"}
                    </p>
                </div>

                <div className={s.headerControls}>
                    {status && (
                        <span className={`${s.dripStatus} ${s[`s_${status}`] ?? ""}`}>
                            <span className={s.dot} />
                            {status}
                        </span>
                    )}
                    {status === "ACTIVE" && (
                        <button
                            className={s.btn}
                            onClick={() => setEnrollment("PAUSED")}
                            disabled={headerBusy}
                        >
                            Pause
                        </button>
                    )}
                    {status === "PAUSED" && (
                        <button
                            className={s.btnPrimary + " " + s.btn}
                            onClick={() => setEnrollment("ACTIVE")}
                            disabled={headerBusy}
                        >
                            Resume
                        </button>
                    )}
                    {status !== "CANCELLED" && (
                        <button
                            className={`${s.btn} ${s.btnDanger}`}
                            onClick={stopDrip}
                            disabled={headerBusy}
                        >
                            Stop drip
                        </button>
                    )}
                </div>
            </header>
            {headerError && <p className={s.error}>{headerError}</p>}

            <ul className={s.list}>
                {messages.map((m, i) => (
                    <li key={m.id} style={{ animationDelay: `${i * 60}ms` }}>
                        <MessageCard
                            message={m}
                            hasEmail={hasEmail}
                            onReactivateEnrollment={() => setStatus("ACTIVE")}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

function MessageCard({
    message,
    hasEmail,
    onReactivateEnrollment,
}: {
    message: DripMessageVM;
    hasEmail: boolean;
    onReactivateEnrollment: () => void;
}) {
    const [status, setStatus] = useState<MsgStatus>(message.status);
    const [subject, setSubject] = useState(message.subject);
    const [body, setBody] = useState(message.body);
    const [when, setWhen] = useState(toLocalInput(message.scheduledFor));
    const [attachments, setAttachments] = useState(message.attachments);
    const [newFile, setNewFile] = useState({ filename: "", url: "" });
    const [savedBaseline, setSavedBaseline] = useState({
        subject: message.subject,
        body: message.body,
        when: toLocalInput(message.scheduledFor),
        attachments: JSON.stringify(message.attachments),
    });
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [savedFlash, setSavedFlash] = useState(false);

    // AI polish
    const [polishOpen, setPolishOpen] = useState(false);
    const [instruction, setInstruction] = useState("");
    const [proposal, setProposal] = useState<{ subject: string; body: string } | null>(null);

    const editable = status === "SCHEDULED";
    const dirty =
        editable &&
        (subject !== savedBaseline.subject ||
            body !== savedBaseline.body ||
            when !== savedBaseline.when ||
            JSON.stringify(attachments) !== savedBaseline.attachments);

    // ── Markdown formatting toolbar ───────────────────────────
    function wrapSelection(before: string, after: string, placeholder: string) {
        const ta = bodyRef.current;
        const start = ta?.selectionStart ?? body.length;
        const end = ta?.selectionEnd ?? body.length;
        const sel = body.slice(start, end) || placeholder;
        const next = body.slice(0, start) + before + sel + after + body.slice(end);
        setBody(next);
        requestAnimationFrame(() => {
            ta?.focus();
            const caret = start + before.length + sel.length + after.length;
            ta?.setSelectionRange(caret, caret);
        });
    }
    function prefixLines(prefix: string) {
        const ta = bodyRef.current;
        const start = ta?.selectionStart ?? 0;
        const end = ta?.selectionEnd ?? 0;
        const sel = body.slice(start, end) || "list item";
        const prefixed = sel
            .split("\n")
            .map((l) => (l.trim() ? `${prefix}${l}` : l))
            .join("\n");
        setBody(body.slice(0, start) + prefixed + body.slice(end));
    }
    function insertLink() {
        const url = window.prompt("Link URL (https://…)")?.trim();
        if (!url) return;
        wrapSelection("[", `](${url})`, "link text");
    }
    function insertImage() {
        const url = window.prompt("Image URL (must be on res.cloudinary.com or cdn.sanity.io)")?.trim();
        if (!url) return;
        if (!ALLOWED_IMG.test(url)) {
            setError("Images must be hosted on res.cloudinary.com or cdn.sanity.io.");
            return;
        }
        const alt = window.prompt("Short image description (alt text)", "")?.trim() ?? "";
        const ta = bodyRef.current;
        const at = ta?.selectionStart ?? body.length;
        const snippet = `\n\n![${alt}](${url})\n\n`;
        setBody(body.slice(0, at) + snippet + body.slice(at));
    }

    function addAttachment() {
        const filename = newFile.filename.trim();
        const url = newFile.url.trim();
        if (!filename || !/^https:\/\//i.test(url)) {
            setError("An attachment needs a filename and an https URL.");
            return;
        }
        setAttachments((a) => [...a, { filename, url }]);
        setNewFile({ filename: "", url: "" });
        setError(null);
    }
    function removeAttachment(idx: number) {
        setAttachments((a) => a.filter((_, i) => i !== idx));
    }

    async function save() {
        setBusy("save");
        setError(null);
        try {
            const res = await fetch(`/api/drip/messages/${message.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    body,
                    scheduledFor: new Date(when).toISOString(),
                    attachments,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            setSavedBaseline({ subject, body, when, attachments: JSON.stringify(attachments) });
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(null);
        }
    }

    async function act(
        action: "skip" | "restore" | "send-now",
        confirmMsg?: string,
    ) {
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        setBusy(action);
        setError(null);
        try {
            const res = await fetch(`/api/drip/messages/${message.id}/${action}`, {
                method: "POST",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Action failed");
            if (action === "skip") setStatus("SKIPPED");
            if (action === "restore") {
                setStatus("SCHEDULED");
                onReactivateEnrollment();
            }
            if (action === "send-now") setStatus("SENT");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(null);
        }
    }

    async function runPolish() {
        if (!instruction.trim()) return;
        setBusy("polish");
        setError(null);
        try {
            const res = await fetch(`/api/drip/messages/${message.id}/polish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instruction, subject, body }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Polish failed");
            setProposal({ subject: data.draft.subject, body: data.draft.body });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(null);
        }
    }

    function acceptProposal() {
        if (!proposal) return;
        setSubject(proposal.subject);
        setBody(proposal.body);
        setProposal(null);
        setPolishOpen(false);
        setInstruction("");
    }

    const step = String(message.stepIndex + 1).padStart(2, "0");
    const cardCls = `${s.card} ${status === "SENT" ? s.locked : ""} ${
        status === "SKIPPED" ? s.dimmed : ""
    }`;

    return (
        <div className={cardCls}>
            <div className={s.cardHead}>
                <div className={s.stepWrap}>
                    <span className={s.plate}>{step}</span>
                    <span className={s.stepMeta}>
                        <span className={s.stepLabel}>Touch {message.stepIndex + 1}</span>
                        {message.contentTitle && (
                            <span className={s.contentRef}>refs “{message.contentTitle}”</span>
                        )}
                    </span>
                </div>
                <span className={`${s.badge} ${s[`b_${status}`] ?? ""}`}>{status}</span>
            </div>

            <div className={s.field}>
                <label className={s.label}>{status === "SENT" ? "Sent" : "Scheduled for"}</label>
                {status === "SENT" ? (
                    <span className={s.sentNote}>
                        {message.sentAt ? new Date(message.sentAt).toLocaleString() : "—"}
                    </span>
                ) : (
                    <input
                        type="datetime-local"
                        className={s.dateInput}
                        value={when}
                        onChange={(e) => setWhen(e.target.value)}
                        disabled={!editable || busy !== null}
                    />
                )}
            </div>

            <div className={s.field}>
                <label className={s.label}>Subject</label>
                <input
                    className={s.input}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!editable || busy !== null}
                />
            </div>

            <div className={s.field}>
                <label className={s.label}>Body</label>
                {editable && (
                    <div className={s.toolbar}>
                        <button type="button" className={s.toolBtn} title="Bold" onClick={() => wrapSelection("**", "**", "bold")}><b>B</b></button>
                        <button type="button" className={s.toolBtn} title="Italic" onClick={() => wrapSelection("_", "_", "italic")}><i>I</i></button>
                        <button type="button" className={s.toolBtn} title="Bulleted list" onClick={() => prefixLines("- ")}>☰</button>
                        <button type="button" className={s.toolBtn} title="Insert link" onClick={insertLink}>🔗</button>
                        <button type="button" className={s.toolBtn} title="Insert image" onClick={insertImage}>🖼</button>
                        <span className={s.toolHint}>Markdown — **bold**, _italic_, - lists, [text](url), ![alt](url)</span>
                    </div>
                )}
                <textarea
                    ref={bodyRef}
                    className={s.textarea}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={!editable || busy !== null}
                />
            </div>

            {(editable || attachments.length > 0) && (
                <div className={s.field}>
                    <label className={s.label}>Attachments</label>
                    {attachments.length === 0 && !editable && (
                        <span className={s.rowMutedSm}>None</span>
                    )}
                    {attachments.length > 0 && (
                        <ul className={s.attachList}>
                            {attachments.map((a, idx) => (
                                <li key={idx} className={s.attachItem}>
                                    <span className={s.attachClip}>📎</span>
                                    <a href={a.url} target="_blank" rel="noreferrer" className={s.attachName}>
                                        {a.filename}
                                    </a>
                                    {editable && (
                                        <button
                                            type="button"
                                            className={s.attachRemove}
                                            onClick={() => removeAttachment(idx)}
                                            aria-label={`Remove ${a.filename}`}
                                        >
                                            ×
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {editable && (
                        <div className={s.attachAdd}>
                            <input
                                className={s.attachInput}
                                placeholder="File name (e.g. ADU-brochure.pdf)"
                                value={newFile.filename}
                                onChange={(e) => setNewFile((f) => ({ ...f, filename: e.target.value }))}
                            />
                            <input
                                className={s.attachInput}
                                placeholder="https://… file URL"
                                value={newFile.url}
                                onChange={(e) => setNewFile((f) => ({ ...f, url: e.target.value }))}
                            />
                            <button type="button" className={`${s.btn}`} onClick={addAttachment}>
                                Add
                            </button>
                        </div>
                    )}
                </div>
            )}

            {polishOpen && editable && (
                <div className={s.polishPanel}>
                    <div className={s.polishHead}>✦ Polish with AI</div>
                    <div className={s.polishRow}>
                        <input
                            className={s.polishInput}
                            placeholder="e.g. warmer tone, mention the Encinitas build, tighten to 3 sentences…"
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            disabled={busy === "polish"}
                        />
                        <button
                            className={`${s.btn} ${s.btnGold}`}
                            onClick={runPolish}
                            disabled={busy === "polish" || !instruction.trim()}
                        >
                            {busy === "polish" ? "Polishing…" : "Polish"}
                        </button>
                    </div>

                    {proposal && (
                        <div className={s.proposal}>
                            <p className={s.proposalLabel}>Proposed subject</p>
                            <p className={s.proposalSubject}>{proposal.subject}</p>
                            <p className={s.proposalLabel}>Proposed body</p>
                            <p className={s.proposalBody}>{proposal.body}</p>
                            <div className={s.proposalActions}>
                                <button
                                    className={`${s.btn} ${s.btnPrimary}`}
                                    onClick={acceptProposal}
                                >
                                    Use this draft
                                </button>
                                <button className={s.btn} onClick={() => setProposal(null)}>
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={s.actions}>
                {editable && (
                    <>
                        <button
                            className={`${s.btn} ${s.btnPrimary}`}
                            onClick={save}
                            disabled={busy !== null || !dirty}
                        >
                            {busy === "save" ? "Saving…" : "Save"}
                        </button>
                        {savedFlash && <span className={s.savedFlash}>Saved ✓</span>}
                        <button
                            className={`${s.btn} ${s.btnGhost}`}
                            onClick={() => setPolishOpen((o) => !o)}
                            disabled={busy !== null}
                        >
                            ✦ AI polish
                        </button>
                        <span className={s.spacer} />
                        <button
                            className={`${s.btn}`}
                            onClick={() =>
                                act("send-now", "Send this email now instead of on its date?")
                            }
                            disabled={busy !== null || !hasEmail}
                            title={hasEmail ? "" : "No customer email on file"}
                        >
                            {busy === "send-now" ? "Sending…" : "Send now"}
                        </button>
                        <button
                            className={`${s.btn} ${s.btnDanger}`}
                            onClick={() => act("skip")}
                            disabled={busy !== null}
                        >
                            {busy === "skip" ? "Skipping…" : "Skip this one"}
                        </button>
                    </>
                )}

                {status === "SKIPPED" && (
                    <button
                        className={`${s.btn} ${s.btnPrimary}`}
                        onClick={() => act("restore")}
                        disabled={busy !== null}
                    >
                        {busy === "restore" ? "Restoring…" : "Restore"}
                    </button>
                )}

                {status === "FAILED" && (
                    <button
                        className={`${s.btn}`}
                        onClick={() => act("send-now", "Retry sending this email now?")}
                        disabled={busy !== null || !hasEmail}
                    >
                        {busy === "send-now" ? "Sending…" : "Retry send"}
                    </button>
                )}

                {status === "SENT" && <span className={s.sentNote}>Delivered — locked</span>}
            </div>

            {error && <p className={s.error}>{error}</p>}
        </div>
    );
}
