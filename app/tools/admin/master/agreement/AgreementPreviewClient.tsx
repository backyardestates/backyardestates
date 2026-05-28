"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import mammoth from "mammoth";
import { generateAgreement, triggerDownload } from "@/lib/agreement/generateAgreement";
import {
    buildAgreementData,
    type AgreementBuildInput,
    type AgreementTemplateData,
} from "@/lib/agreement/buildAgreementData";
import s from "./AgreementPreviewClient.module.css";

const HANDOFF_KEY = "be_agreement_preview_input_v2";
// Legacy v1 handoff was the resolved AgreementTemplateData. Read it for
// backward compatibility if a stale handoff exists in localStorage.
const LEGACY_HANDOFF_KEY = "be_agreement_preview_data_v1";

// ── Post-process mammoth's HTML to match the original document's layout ───
//
// Mammoth flattens everything to <p><strong>…</strong></p>. Word's visual
// structure (title block, numbered section headings, lettered sub-items
// with hanging indent, attachment headers) lives in tab characters and
// paragraph styling that mammoth strips. We re-derive those structures
// from the text patterns and tag the paragraphs with classes the CSS can
// then style faithfully.
function postProcessHtml(html: string): string {
    if (typeof window === "undefined") return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) return html;

    const children = Array.from(root.children);
    let titleAssigned = 0;

    for (const el of children) {
        if (el.tagName !== "P") continue;
        const p = el as HTMLParagraphElement;
        const text = p.textContent ?? "";
        const trimmed = text.trim();

        // Title block: the first 1–2 entirely-bold paragraphs at the very
        // top get centered, larger, like Word's title style.
        if (
            titleAssigned < 2 &&
            trimmed.length > 0 &&
            isAllBold(p) &&
            !/^\d+\./.test(trimmed) // not a numbered section
        ) {
            p.classList.add("agreement-title");
            titleAssigned++;
            continue;
        }

        // Attachment headers: "Attachment A", "Attachment B", etc.
        if (/^Attachment [A-F]\b/i.test(trimmed) && isAllBold(p)) {
            p.classList.add("agreement-attachment-header");
            continue;
        }

        // Numbered section headers: "1. Project Description", "12. Warranties"
        if (/^\d+\.\s/.test(trimmed) && isAllBold(p)) {
            p.classList.add("agreement-section");
            continue;
        }

        // Lettered sub-items: "a.\tContract Price..." — strip the tab and
        // apply a hanging indent so the text aligns under the body.
        const subitem = trimmed.match(/^([a-z])\.\s/i);
        if (subitem) {
            p.classList.add("agreement-subitem");
            const first = p.firstChild;
            if (first && first.nodeType === Node.TEXT_NODE) {
                first.textContent = (first.textContent ?? "").replace(/^([a-z])\.\t+/i, "$1.  ");
            }
            continue;
        }
    }

    return root.innerHTML;
}

function isAllBold(p: HTMLParagraphElement): boolean {
    const clone = p.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("strong, b").forEach((n) => n.remove());
    return clone.textContent?.trim().length === 0;
}

type Phase =
    | { state: "loading" }
    | { state: "ready" }
    | { state: "error"; message: string };

export function AgreementPreviewClient({
    initialInput,
    proposalId,
}: {
    /** Phase 0b: when provided (by the /agreement/[id] route), the preview
     *  builds from this persisted input instead of the localStorage handoff
     *  the admin tab writes. Absent for the live "Edit Agreement" flow. */
    initialInput?: AgreementBuildInput;
    /** Phase 6: present in by-id mode — enables "Send for signature". */
    proposalId?: string;
} = {}) {
    const [phase, setPhase] = useState<Phase>({ state: "loading" });
    const [signState, setSignState] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [signError, setSignError] = useState<string | null>(null);
    const [html, setHtml] = useState<string>("");
    const [data, setData] = useState<AgreementTemplateData | null>(null);
    /** Original (un-edited) Blob, kept so the user can download the .docx
     *  even after editing the HTML inline. */
    const docxBlobRef = useRef<Blob | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    /** The full rebuild inputs handed off by the admin tab. Null when running
     *  on the legacy v1 handoff (no rebuild possible — switcher hidden). */
    const [input, setInput] = useState<AgreementBuildInput | null>(null);
    /** Currently-active compared unit. Defaults to the admin's `selectedAduId`
     *  in the handoff, falls back to the first compared unit with a schedule. */
    const [selectedAduId, setSelectedAduId] = useState<string | null>(null);

    // Snapshot the comparable-unit options for the dropdown. Only units that
    // actually have a payment schedule are eligible — otherwise the agreement
    // would have no contract total to base itself on.
    const switchableUnits = useMemo(() => {
        if (!input) return [];
        const schedules = input.proposalPaymentSchedulesByAduId ?? {};
        return (input.comparedUnitIds ?? [])
            .map((id) => {
                const fp = input.floorplans.find((f) => f._id === id);
                const sched = schedules[id];
                if (!fp || !sched) return null;
                return { id, name: fp.name, sqft: fp.sqft, total: sched.totalPrice };
            })
            .filter((u): u is { id: string; name: string; sqft: number; total: number } => u != null);
    }, [input]);

    // ── Initial load: read handoff, parse, render once ────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Phase 0b: by-id mode — build from the persisted input prop.
                if (initialInput) {
                    setInput(initialInput);
                    setSelectedAduId(
                        initialInput.selectedAduId ??
                            (initialInput.comparedUnitIds ?? []).find(
                                (id) => initialInput.proposalPaymentSchedulesByAduId?.[id]
                            ) ??
                            null
                    );
                    return;
                }

                const raw = window.localStorage.getItem(HANDOFF_KEY);
                if (raw) {
                    let parsed: AgreementBuildInput;
                    try {
                        parsed = JSON.parse(raw) as AgreementBuildInput;
                    } catch {
                        throw new Error("Proposal data is malformed.");
                    }
                    if (cancelled) return;
                    setInput(parsed);
                    setSelectedAduId(
                        parsed.selectedAduId ??
                            (parsed.comparedUnitIds ?? []).find(
                                (id) => parsed.proposalPaymentSchedulesByAduId?.[id]
                            ) ??
                            null
                    );
                    return; // the effect below will render once `input` + `selectedAduId` are set
                }

                // Backward compat: legacy v1 handoff was the resolved template
                // data, not the rebuild inputs. Render it once and don't show
                // the switcher.
                const legacyRaw = window.localStorage.getItem(LEGACY_HANDOFF_KEY);
                if (!legacyRaw) {
                    throw new Error(
                        "No proposal data found. Open this page from the admin tool's 'Edit Agreement' button — that's what passes the data in."
                    );
                }
                const legacyParsed = JSON.parse(legacyRaw) as AgreementTemplateData;
                if (cancelled) return;
                setData(legacyParsed);
                const blob = await generateAgreement(legacyParsed);
                if (cancelled) return;
                docxBlobRef.current = blob;
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                if (cancelled) return;
                setHtml(postProcessHtml(result.value));
                setPhase({ state: "ready" });
            } catch (err) {
                if (cancelled) return;
                setPhase({
                    state: "error",
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        })();
        return () => { cancelled = true; };
    }, [initialInput]);

    // ── Rebuild whenever the selected unit changes ────────────────────────
    useEffect(() => {
        if (!input) return;
        let cancelled = false;
        setPhase({ state: "loading" });
        (async () => {
            try {
                const built = buildAgreementData({ ...input, selectedAduId });
                if (cancelled) return;
                setData(built);
                const blob = await generateAgreement(built);
                if (cancelled) return;
                docxBlobRef.current = blob;
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                if (cancelled) return;
                setHtml(postProcessHtml(result.value));
                setPhase({ state: "ready" });
            } catch (err) {
                if (cancelled) return;
                setPhase({
                    state: "error",
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        })();
        return () => { cancelled = true; };
    }, [input, selectedAduId]);

    function handlePrint() {
        window.print();
    }

    function handleDownloadDocx() {
        if (!docxBlobRef.current || !data) return;
        const lastName = data.customerLastName || "Customer";
        const unitSuffix = data.aduName && data.aduName !== "—"
            ? `-${data.aduName.replace(/[^a-z0-9]+/gi, "-")}`
            : "";
        const safeAddress = data.propertyAddress
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "proposal";
        triggerDownload(
            docxBlobRef.current,
            `BackyardEstates-Agreement-${lastName}-${safeAddress}${unitSuffix}.docx`
        );
    }

    async function handleSendForSignature() {
        if (!proposalId || !docxBlobRef.current) return;
        setSignState("sending");
        setSignError(null);
        try {
            const lastName = data?.customerLastName || "Customer";
            const fd = new FormData();
            fd.append(
                "file",
                new File([docxBlobRef.current], `BackyardEstates-Agreement-${lastName}.docx`, {
                    type:
                        docxBlobRef.current.type ||
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                }),
            );
            const res = await fetch(`/api/proposals/${proposalId}/send-for-signature`, {
                method: "POST",
                body: fd,
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Failed to send for signature");
            setSignState("sent");
        } catch (err) {
            setSignError(err instanceof Error ? err.message : String(err));
            setSignState("error");
        }
    }

    function statusText() {
        if (phase.state === "loading") return "Generating from your proposal…";
        if (phase.state === "ready") return "Editable. Click any text to make changes.";
        if (phase.state === "error") return "Couldn't generate the agreement.";
        return "";
    }

    return (
        <div className={s.root}>
            <div className={s.toolbar}>
                <div className={s.toolbarLeft}>
                    <span className={s.title}>Agreement Preview</span>
                    {data && (
                        <span className={s.subtitle}>
                            {data.customerName || "—"} · {data.propertyAddress || "—"}
                        </span>
                    )}
                    <span className={s.status}>{statusText()}</span>
                </div>

                <div className={s.actions}>
                    {/* Unit switcher — visible whenever the rebuild inputs are
                        available and there's more than one compared unit. */}
                    {switchableUnits.length > 1 && (
                        <label className={s.unitSwitch}>
                            <span className={s.unitSwitchLabel}>Based on</span>
                            <select
                                className={s.unitSwitchSelect}
                                value={selectedAduId ?? ""}
                                onChange={(e) => setSelectedAduId(e.target.value || null)}
                                disabled={phase.state === "loading"}
                                title="Switch which compared unit drives the agreement — totals and exclusions update accordingly"
                            >
                                {switchableUnits.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                        {u.sqft ? ` — ${u.sqft.toLocaleString()} sqft` : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <button
                        type="button"
                        className={s.btn}
                        onClick={handleDownloadDocx}
                        disabled={phase.state !== "ready"}
                        title="Downloads the editable Word document generated from your proposal data. Inline edits made in this preview are NOT included — use this when you want to keep editing in Microsoft Word."
                    >
                        <span className={s.btnLabel}>
                            <span>Download .docx</span>
                            <span className={s.btnHint}>editable in Word · no inline edits</span>
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`${s.btn} ${s.btnPrimary}`}
                        onClick={handlePrint}
                        disabled={phase.state !== "ready"}
                        title="Opens the browser print dialog so you can save the agreement as a PDF. Any inline edits you've made in this preview ARE included — use this for the final version to send the customer."
                    >
                        <span className={s.btnLabel}>
                            <span>Save as PDF</span>
                            <span className={s.btnHint}>final · includes your inline edits</span>
                        </span>
                    </button>
                    {proposalId && (
                        <button
                            type="button"
                            className={`${s.btn} ${s.btnPrimary}`}
                            onClick={handleSendForSignature}
                            disabled={
                                phase.state !== "ready" ||
                                signState === "sending" ||
                                signState === "sent"
                            }
                            title="Send this agreement to the customer for e-signature via Dropbox Sign."
                        >
                            <span className={s.btnLabel}>
                                <span>
                                    {signState === "sent"
                                        ? "Sent for signature ✓"
                                        : signState === "sending"
                                          ? "Sending…"
                                          : "Send for signature"}
                                </span>
                                <span className={s.btnHint}>
                                    {signError ?? "e-sign · Dropbox Sign"}
                                </span>
                            </span>
                        </button>
                    )}
                </div>
            </div>

            <div className={s.page}>
                {phase.state === "error" ? (
                    <div className={s.errorBox}>{phase.message}</div>
                ) : phase.state === "loading" ? (
                    <div className={s.empty}>Generating agreement…</div>
                ) : (
                    <div
                        ref={editorRef}
                        className={s.editor}
                        contentEditable
                        suppressContentEditableWarning
                        spellCheck
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                )}
            </div>
        </div>
    );
}
