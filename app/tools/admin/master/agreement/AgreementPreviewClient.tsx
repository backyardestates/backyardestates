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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AgreementPreviewClient({
    initialInput,
    proposalId,
    initialEmail,
}: {
    /** Phase 0b: when provided (by the /agreement/[id] route), the preview
     *  builds from this persisted input instead of the localStorage handoff
     *  the admin tab writes. Absent for the live "Edit Agreement" flow. */
    initialInput?: AgreementBuildInput;
    /** Phase 6: present in by-id mode — enables "Send for signature". */
    proposalId?: string;
    /** Customer email on file (proposal → engagement). When absent, the rep is
     *  prompted to enter one inline before sending for signature. */
    initialEmail?: string;
} = {}) {
    const [phase, setPhase] = useState<Phase>({ state: "loading" });
    const [signState, setSignState] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [signError, setSignError] = useState<string | null>(null);
    // Recipient email for e-signature. Seeded from what's on file; editable when
    // missing so the rep never gets blocked at send time.
    const [recipientEmail, setRecipientEmail] = useState(initialEmail ?? "");
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedUrl, setSavedUrl] = useState<string | null>(null);
    /** Whether the post-save Pipedrive note landed — surfaced on the button so
     *  the rep knows the deal record got the link (or why it didn't). */
    const [pipedriveNote, setPipedriveNote] =
        useState<"posted" | "no-link" | "not-configured" | "failed" | null>(null);
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

    /** Live sync: when on, the preview re-reads the admin tab's handoff and
     *  rebuilds whenever the proposal changes (cross-tab `storage` event).
     *  Available in BOTH flows — the admin tab keeps writing HANDOFF_KEY as the
     *  rep edits, so even the by-id preview (opened with ?proposalId=) picks up
     *  changes. When opened standalone (no admin tab editing), no events fire,
     *  so it just sits idle. Defaults on; the rep can pause it while reading. */
    const liveSyncAvailable = true;
    const [liveSync, setLiveSync] = useState(true);
    /** Bumped when a live update arrives — drives the "updated" flash. */
    const [liveTick, setLiveTick] = useState(0);

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

    // ── Live sync — re-read the admin handoff when the proposal changes ──────
    // The admin tab keeps `HANDOFF_KEY` fresh (debounced) as the rep edits.
    // `storage` events fire in *other* tabs/windows, so this preview window
    // hears every change. We swap in the new input (keeping the rep's chosen
    // unit when it still exists); the rebuild effect above then regenerates.
    useEffect(() => {
        if (!liveSyncAvailable || !liveSync) return;
        function onStorage(e: StorageEvent) {
            if (e.key !== HANDOFF_KEY || !e.newValue) return;
            let parsed: AgreementBuildInput;
            try {
                parsed = JSON.parse(e.newValue) as AgreementBuildInput;
            } catch {
                return; // ignore malformed mid-write values
            }
            // Guard against cross-proposal contamination: if this preview is
            // pinned to a specific proposal (by-id mode), only accept a live
            // update that's for the SAME property. Otherwise switching proposals
            // in the admin tab would hijack this window.
            const pinnedAddress = initialInput?.propertyAddress;
            if (pinnedAddress && parsed.propertyAddress !== pinnedAddress) {
                return;
            }
            setInput(parsed);
            // Keep the current unit if it's still valid; otherwise fall back.
            setSelectedAduId((cur) => {
                const stillValid = cur && parsed.proposalPaymentSchedulesByAduId?.[cur];
                if (stillValid) return cur;
                return (
                    parsed.selectedAduId ??
                    (parsed.comparedUnitIds ?? []).find(
                        (id) => parsed.proposalPaymentSchedulesByAduId?.[id]
                    ) ??
                    null
                );
            });
            setLiveTick((t) => t + 1);
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [liveSyncAvailable, liveSync, initialInput]);

    // Clear the "updated" flash shortly after each live update.
    useEffect(() => {
        if (liveTick === 0) return;
        const id = window.setTimeout(() => setLiveTick(0), 1600);
        return () => window.clearTimeout(id);
    }, [liveTick]);

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
        const to = recipientEmail.trim();
        if (!EMAIL_RE.test(to)) {
            setSignError("Enter a valid customer email to send the agreement.");
            setSignState("error");
            return;
        }
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
            fd.append("to", to);
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

    // Render the (inline-edited) agreement to a real PDF in-browser, then store
    // it (Cloudinary → Sanity fallback) so it's retrievable from any device.
    async function handleSavePdf() {
        if (!proposalId || !editorRef.current) return;
        setSaveState("saving");
        setSaveError(null);
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import("html2canvas"),
                import("jspdf"),
            ]);
            const el = editorRef.current;
            const canvas = await html2canvas(el, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
            });
            const pdf = new jsPDF({ unit: "pt", format: "letter" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 36;
            const imgW = pageW - margin * 2;
            const imgH = (canvas.height * imgW) / canvas.width;
            const imgData = canvas.toDataURL("image/jpeg", 0.92);

            let heightLeft = imgH;
            let position = margin;
            pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH, undefined, "FAST");
            heightLeft -= pageH - margin * 2;
            while (heightLeft > 0) {
                position = margin - (imgH - heightLeft);
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH, undefined, "FAST");
                heightLeft -= pageH - margin * 2;
            }

            const blob = pdf.output("blob");
            const lastName = data?.customerLastName || "Customer";
            const safeAddress =
                (data?.propertyAddress ?? "")
                    .replace(/[^a-z0-9]+/gi, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 60) || "proposal";
            const fd = new FormData();
            fd.append(
                "file",
                new File([blob], `BackyardEstates-Agreement-${lastName}-${safeAddress}.pdf`, {
                    type: "application/pdf",
                }),
            );
            const res = await fetch(`/api/proposals/${proposalId}/agreement-pdf`, {
                method: "POST",
                body: fd,
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Failed to save the PDF");
            setSavedUrl(d.pdfUrl ?? null);
            setPipedriveNote(d.pipedriveNote ?? null);
            setSaveState("saved");
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : String(err));
            setSaveState("error");
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
                {/* ── Identity + live status ─────────────────────────────── */}
                <div className={s.toolbarLeft}>
                    <div className={s.identity}>
                        <span className={s.title}>Agreement Preview</span>
                        {data && (
                            <span className={s.subtitle}>
                                {data.customerName || "—"} · {data.propertyAddress || "—"}
                            </span>
                        )}
                    </div>

                    {/* Live-sync pill — a status indicator (distinct from the
                        action buttons), only in the live "Edit Agreement" flow. */}
                    {liveSyncAvailable && (
                        <button
                            type="button"
                            className={`${s.livePill} ${liveSync ? s.liveOn : s.livePaused} ${liveTick > 0 ? s.liveFlash : ""}`}
                            onClick={() => setLiveSync((v) => !v)}
                            title={
                                liveSync
                                    ? "Live — this preview updates automatically as you edit the proposal. Click to pause."
                                    : "Paused — click to resume live updates from the proposal."
                            }
                            aria-pressed={liveSync}
                        >
                            <span className={s.liveDot} aria-hidden />
                            <span className={s.livePillText}>
                                {liveSync ? (liveTick > 0 ? "Updated" : "Live") : "Paused"}
                            </span>
                        </button>
                    )}

                    <span className={s.status}>{statusText()}</span>
                </div>

                {/* ── Actions — grouped by tier, wraps gracefully ────────── */}
                <div className={s.actions}>
                    {/* Context: which unit drives the agreement. */}
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

                    {/* Secondary: download outputs. */}
                    <div className={s.btnGroup}>
                        <button
                            type="button"
                            className={s.btn}
                            onClick={handleDownloadDocx}
                            disabled={phase.state !== "ready"}
                            title="Downloads the editable Word document generated from your proposal data. Inline edits made in this preview are NOT included — use this when you want to keep editing in Microsoft Word."
                        >
                            <span className={s.btnIcon} aria-hidden>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                            </span>
                            <span className={s.btnLabel}>
                                <span>.docx</span>
                                <span className={s.btnHint}>editable · no inline edits</span>
                            </span>
                        </button>
                        <button
                            type="button"
                            className={s.btn}
                            onClick={handlePrint}
                            disabled={phase.state !== "ready"}
                            title="Opens the browser print dialog so you can save the agreement as a PDF. Any inline edits you've made in this preview ARE included — use this for the final version to send the customer."
                        >
                            <span className={s.btnIcon} aria-hidden>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                            </span>
                            <span className={s.btnLabel}>
                                <span>PDF</span>
                                <span className={s.btnHint}>final · includes edits</span>
                            </span>
                        </button>
                    </div>

                    {/* Save to the deal record (secondary, only when saved). */}
                    {proposalId && (
                        <button
                            type="button"
                            className={`${s.btn} ${saveState === "saved" ? s.btnSuccess : ""}`}
                            onClick={handleSavePdf}
                            disabled={phase.state !== "ready" || saveState === "saving"}
                            title="Generates a PDF (with your inline edits) and stores it to the cloud so you — and the deal record — can open the latest agreement from any device."
                        >
                            <span className={s.btnLabel}>
                                <span>
                                    {saveState === "saved"
                                        ? (pipedriveNote === "posted" ? "Saved + noted ✓" : "Saved ✓")
                                        : saveState === "saving"
                                            ? "Saving…"
                                            : "Save to deal"}
                                </span>
                                <span className={s.btnHint}>
                                    {saveState === "saved" ? (
                                        <>
                                            {savedUrl && (
                                                <a href={savedUrl} target="_blank" rel="noopener noreferrer">
                                                    Open saved PDF
                                                </a>
                                            )}
                                            {pipedriveNote === "posted" && " · note added to Pipedrive"}
                                            {pipedriveNote === "no-link" && " · no Pipedrive deal linked"}
                                            {pipedriveNote === "failed" && " · Pipedrive note failed"}
                                            {pipedriveNote === "not-configured" && " · Pipedrive not configured"}
                                        </>
                                    ) : (
                                        saveError ?? "stores PDF + posts link to Pipedrive"
                                    )}
                                </span>
                            </span>
                        </button>
                    )}

                    {/* Primary: the terminal action — send for signature. */}
                    {proposalId && (
                        <div className={s.primaryCluster}>
                            <label className={s.recipient} title="The agreement is e-signed by this customer email.">
                                <span className={s.recipientLabel}>Send to</span>
                                <input
                                    type="email"
                                    className={s.recipientInput}
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="customer@example.com"
                                    disabled={signState === "sending" || signState === "sent"}
                                />
                            </label>
                            <button
                                type="button"
                                className={`${s.btn} ${s.btnPrimary}`}
                                onClick={handleSendForSignature}
                                disabled={
                                    phase.state !== "ready" ||
                                    signState === "sending" ||
                                    signState === "sent" ||
                                    !EMAIL_RE.test(recipientEmail.trim())
                                }
                                title="Send this agreement to the customer for e-signature via Dropbox Sign."
                            >
                                <span className={s.btnIcon} aria-hidden>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                </span>
                                <span className={s.btnLabel}>
                                    <span>
                                        {signState === "sent"
                                            ? "Sent for signature ✓"
                                            : signState === "sending"
                                                ? "Sending…"
                                                : "Send for signature"}
                                    </span>
                                    <span className={s.btnHint}>
                                        {signError ??
                                            (signState === "sent"
                                                ? "signed copy saves automatically"
                                                : "e-sign · Dropbox Sign")}
                                    </span>
                                </span>
                            </button>
                        </div>
                    )}

                    {!proposalId && phase.state === "ready" && (
                        <span className={s.saveHint} title="The agreement couldn't be attached to a saved proposal.">
                            Save the proposal to enable saving &amp; sending for signature.
                        </span>
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
