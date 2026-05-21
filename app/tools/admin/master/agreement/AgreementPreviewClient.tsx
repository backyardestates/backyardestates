"use client";

import React, { useEffect, useRef, useState } from "react";
import mammoth from "mammoth";
import { generateAgreement, triggerDownload } from "@/lib/agreement/generateAgreement";
import type { AgreementTemplateData } from "@/lib/agreement/buildAgreementData";
import s from "./AgreementPreviewClient.module.css";

const HANDOFF_KEY = "be_agreement_preview_data_v1";

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
            // Replace the tab character with two non-breaking spaces so the
            // letter and text are separated visually even after editing.
            const first = p.firstChild;
            if (first && first.nodeType === Node.TEXT_NODE) {
                first.textContent = (first.textContent ?? "").replace(/^([a-z])\.\t+/i, "$1.  ");
            }
            continue;
        }
    }

    return root.innerHTML;
}

function isAllBold(p: HTMLParagraphElement): boolean {
    // The paragraph is "fully bold" if every visible text node lives inside a
    // <strong>/<b> ancestor — i.e. removing all <strong>/<b> elements would
    // leave only whitespace.
    const clone = p.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("strong, b").forEach((n) => n.remove());
    return clone.textContent?.trim().length === 0;
}

type Phase =
    | { state: "loading" }
    | { state: "ready" }
    | { state: "error"; message: string };

export function AgreementPreviewClient() {
    const [phase, setPhase] = useState<Phase>({ state: "loading" });
    const [html, setHtml] = useState<string>("");
    const [data, setData] = useState<AgreementTemplateData | null>(null);
    /** Original (un-edited) Blob, kept so the user can download the .docx
     *  even after editing the HTML inline. */
    const docxBlobRef = useRef<Blob | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // ── Step 1: read handoff data the admin tab wrote before opening this one
                const raw = window.localStorage.getItem(HANDOFF_KEY);
                if (!raw) {
                    throw new Error(
                        "No proposal data found. Open this page from the admin tool's 'Edit Agreement' button — that's what passes the data in."
                    );
                }
                let parsed: AgreementTemplateData;
                try {
                    parsed = JSON.parse(raw) as AgreementTemplateData;
                } catch {
                    throw new Error("Proposal data is malformed.");
                }
                if (cancelled) return;
                setData(parsed);

                // ── Step 2: generate the populated .docx blob
                const blob = await generateAgreement(parsed);
                if (cancelled) return;
                docxBlobRef.current = blob;

                // ── Step 3: convert the populated .docx → HTML via mammoth
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
        return () => {
            cancelled = true;
        };
    }, []);

    function handlePrint() {
        // Browser print uses the @media print rules in the CSS module to
        // hide the toolbar and render the page in a print-friendly layout.
        // The user picks "Save as PDF" in the dialog.
        window.print();
    }

    function handleDownloadDocx() {
        if (!docxBlobRef.current || !data) return;
        const lastName = data.customerLastName || "Customer";
        const safeAddress = data.propertyAddress
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "proposal";
        triggerDownload(
            docxBlobRef.current,
            `BackyardEstates-Agreement-${lastName}-${safeAddress}.docx`
        );
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
                    <button
                        type="button"
                        className={s.btn}
                        onClick={handleDownloadDocx}
                        disabled={phase.state !== "ready"}
                        title="Download the original .docx (your inline edits are not included)"
                    >
                        Download DOCX
                    </button>
                    <button
                        type="button"
                        className={`${s.btn} ${s.btnPrimary}`}
                        onClick={handlePrint}
                        disabled={phase.state !== "ready"}
                        title="Open the print dialog with your edits applied — choose 'Save as PDF'"
                    >
                        Print / Save as PDF
                    </button>
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
