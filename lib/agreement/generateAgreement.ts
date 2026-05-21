// Loads a .docx template from the public folder, fills it with values via
// docxtemplater, and returns a Blob the caller can download.
//
// The template MUST live at /public/templates/adu-agreement-template.docx.
// Placeholders inside the template use docxtemplater's default syntax:
//   • single value:  {customerName}
//   • loop:          {#paymentSchedule}{label} – {amount}{/paymentSchedule}
// See public/templates/README.md for the full tag reference.

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { AgreementTemplateData } from "./buildAgreementData";

const TEMPLATE_URL = "/templates/adu-agreement-template.docx";

export async function generateAgreement(
    data: AgreementTemplateData,
    options: { templateUrl?: string } = {}
): Promise<Blob> {
    const url = options.templateUrl ?? TEMPLATE_URL;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(
            `Couldn't load agreement template at ${url} (HTTP ${res.status}). ` +
            `See public/templates/README.md for setup.`
        );
    }
    const buffer = await res.arrayBuffer();

    const zip = new PizZip(buffer);
    let doc: Docxtemplater;
    try {
        doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            errorLogging: false,
        });
    } catch (err) {
        throw enrichTemplateError(err);
    }

    try {
        doc.render(data as unknown as Record<string, unknown>);
    } catch (err) {
        throw enrichTemplateError(err);
    }

    const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });
    return out;
}

/** Convenience: build a Blob, generate an object URL, click an invisible
 *  <a download> to save the file, then revoke the URL. */
export function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revoke so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Template error helpers ─────────────────────────────────────────────────

/** docxtemplater's errors are deeply nested. Flatten them to a single
 *  human-readable message naming each broken tag, so the admin knows which
 *  placeholder to fix in their template. */
function enrichTemplateError(err: unknown): Error {
    const e = err as any;
    if (e?.properties?.errors?.length) {
        const reasons = e.properties.errors
            .map((d: any) => {
                const tag = d?.properties?.xtag ?? d?.properties?.tag ?? "?";
                const msg = d?.properties?.explanation ?? d?.message ?? "Unknown error";
                return `• {${tag}} — ${msg}`;
            })
            .join("\n");
        return new Error(
            `Template has errors:\n${reasons}\n\nCheck the placeholders in your .docx — ` +
            `see public/templates/README.md for the full tag list.`
        );
    }
    return err instanceof Error ? err : new Error(String(err));
}
