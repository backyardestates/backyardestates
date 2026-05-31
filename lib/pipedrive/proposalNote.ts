// Shared builder for the rich Pipedrive notes posted when a rep saves a
// proposal/agreement PDF. Centralizes the "what is this proposal about?"
// summary so the agreement-pdf and proposal-pdf routes stay in sync.
//
// Pure + dependency-light (only the agreement builder + unit resolvers) so it
// can run server-side in either route.

import {
    buildAgreementData,
    type AgreementBuildInput,
} from "@/lib/agreement/buildAgreementData";
import {
    resolveAduType,
    resolveBeds,
    resolveBaths,
    aduTypeInline,
} from "@/lib/units/resolveUnitSpec";
import { money, num } from "@/lib/investment/format";

export interface ProposalNoteContext {
    /** Stored agreement build inputs (Proposal.agreementInput). May be null. */
    agreementInput: unknown;
    customerName: string | null;
    addressLine1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
}

/** Build the per-compared-unit summary lines, e.g.
 *    • detached Estate 750 — 750 sqft · 2bd/2ba · $235,000  ◀ selected
 *  Returns [] when the input can't be parsed / has no compared units. */
function buildUnitLines(input: AgreementBuildInput): string[] {
    const schedules = input.proposalPaymentSchedulesByAduId ?? {};
    const comparedIds = input.comparedUnitIds ?? [];
    if (comparedIds.length === 0) return [];

    // Which unit drives the agreement (mirrors buildAgreementData's resolution).
    const activeId =
        (input.selectedAduId && schedules[input.selectedAduId])
            ? input.selectedAduId
            : comparedIds.find((id) => schedules[id]) ??
              Object.keys(schedules)[0] ??
              null;

    const lines: string[] = [];
    for (const id of comparedIds) {
        const fp = input.floorplans.find((f) => f._id === id);
        if (!fp) continue;
        const type = aduTypeInline(resolveAduType(id, input.aduTypeByUnitId, input.aduType));
        const beds = resolveBeds(fp, input.bedsByUnitId);
        const baths = resolveBaths(fp, input.bathsByUnitId);
        // Prefer the payment-schedule total (the contract price). Fall back to
        // the floorplan's own price so a unit still shows a number even if its
        // schedule hasn't been generated yet.
        const scheduleTotal = schedules[id]?.totalPrice;
        const total =
            typeof scheduleTotal === "number" && scheduleTotal > 0
                ? scheduleTotal
                : (typeof fp.price === "number" && fp.price > 0 ? fp.price : null);

        const bits = [
            fp.sqft ? `${num(fp.sqft)} sqft` : null,
            (beds || baths) ? `${beds}bd/${baths}ba` : null,
            total != null ? money(total) : null,
        ].filter(Boolean);

        const marker = id === activeId ? "  ◀ selected" : "";
        lines.push(`• ${type} ${fp.name}${bits.length ? " — " + bits.join(" · ") : ""}${marker}`);
    }
    return lines;
}

/**
 * Compose a Pipedrive note describing the saved proposal/agreement.
 *
 * @param ctx      proposal fields + stored agreement inputs
 * @param opts.kind  "agreement" | "proposal" — sets the header + emoji
 * @param opts.pdfUrl  link to the uploaded PDF
 * @param opts.toolUrl deep link back into the tool
 * @param opts.date    pre-formatted date string (caller controls TZ/locale)
 */
export function buildProposalNote(
    ctx: ProposalNoteContext,
    opts: {
        kind: "agreement" | "proposal";
        pdfUrl: string;
        toolUrl: string;
        date: string;
    },
): string {
    const customer = ctx.customerName || "this customer";
    const siteAddress = [ctx.addressLine1, ctx.city, ctx.state, ctx.zip]
        .filter(Boolean)
        .join(", ");

    const header =
        opts.kind === "agreement"
            ? `📄 Agreement saved (${opts.date}) — ${customer}`
            : `📊 Proposal saved (${opts.date}) — ${customer}`;

    let unitLines: string[] = [];
    let activeSummary: string | null = null;
    try {
        if (ctx.agreementInput) {
            const input = ctx.agreementInput as AgreementBuildInput;
            unitLines = buildUnitLines(input);
            // The contracted/active unit + total, derived the canonical way.
            const built = buildAgreementData(input);
            const name =
                built.aduNameWithType && built.aduNameWithType !== "—"
                    ? built.aduNameWithType
                    : built.aduName !== "—"
                        ? built.aduName
                        : null;
            if (opts.kind === "agreement" && name && built.contractTotalNumber > 0) {
                activeSummary = `Contracted: ${name} — ${built.contractTotal}`;
            }
        }
    } catch {
        // Best-effort: a malformed input just omits the unit detail.
    }

    const lines: (string | null)[] = [header];
    if (siteAddress) lines.push(`Site: ${siteAddress}`);

    if (unitLines.length > 0) {
        lines.push("");
        lines.push(unitLines.length === 1 ? "Unit:" : `Units compared (${unitLines.length}):`);
        lines.push(...unitLines);
    }
    if (activeSummary) {
        lines.push("");
        lines.push(activeSummary);
    }

    lines.push("");
    lines.push(`${opts.kind === "agreement" ? "Agreement" : "Proposal"} PDF: ${opts.pdfUrl}`);
    lines.push(`Open in tool: ${opts.toolUrl}`);

    return lines.filter((l) => l !== null).join("\n");
}
