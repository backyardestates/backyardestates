"use client";

import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
    usePresentationStore,
    type SanityFloorplan,
    type SanityStory,
    type SanityProperty,
    type InclusionCategoryData,
    type TaxTopicData,
    type CityData,
    type DiscountPresetData,
    type AdminBroadcast,
} from "@/lib/store/presentationStore";
import { startPresenterSync } from "@/lib/sync/presentationSync";
import { selectStory } from "@/lib/investment/storySelector";

import s from "./PrintClient.module.css";

// Use the exact same slide registry the live presenter uses, so the PDF is a
// 1:1 reflection of the deck order.
import { V2_SLIDES } from "../slides/registry";

const SLIDES = V2_SLIDES.map((sl) => ({ n: sl.n, Component: sl.Component }));

interface Props {
    floorplans: SanityFloorplan[];
    stories: SanityStory[];
    completedProperties: SanityProperty[];
    inclusionsCatalog?: InclusionCategoryData[];
    inclusionsSidebar?: { deptPills: string[]; feeBullets: string[] } | null;
    taxTopicsCatalog?: TaxTopicData[];
    citiesCatalog?: CityData[];
    discountsCatalog?: DiscountPresetData[];
    /** By-id export mode: seed the store from this persisted payload and render
     *  standalone (no BroadcastChannel/localStorage). When absent, the print
     *  view hydrates from a live admin session via startPresenterSync(). */
    initialBroadcast?: Partial<AdminBroadcast>;
    /** Proposal id — enables "Save to Pipedrive" (upload the deck PDF + post a
     *  note). Present in the by-id export route; absent in the live print view. */
    proposalId?: string;
}

// How long to wait after mount before snapshotting. Long enough for every
// useCountUp delay+duration to finish (longest chain is < 2s) and any async
// images to load.
const SETTLE_MS = 2500;

type Phase =
    | { state: "loading" }
    | { state: "ready" }
    | { state: "rendering"; current: number; total: number }
    | { state: "done" }
    | { state: "error"; message: string };

export function PrintClient({
    floorplans,
    stories,
    completedProperties,
    inclusionsCatalog,
    inclusionsSidebar,
    taxTopicsCatalog,
    citiesCatalog,
    discountsCatalog,
    initialBroadcast,
    proposalId,
}: Props) {
    const {
        setSanityData,
        setCatalogData,
        setPrintMode,
        setSelectedStory,
        customerMotivation,
        storyOverridden,
        stories: storeStories,
        featuredStoryIds,
        customerName,
        propertyAddress,
    } = usePresentationStore();

    const [phase, setPhase] = useState<Phase>({ state: "loading" });
    // "Save to Pipedrive" state — uploads the deck PDF + posts a note. Separate
    // from `phase` (which drives the download flow + slide-capture progress).
    const [pdSaveState, setPdSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [pdNote, setPdNote] = useState<"posted" | "no-link" | "not-configured" | "failed" | null>(null);
    const [pdError, setPdError] = useState<string | null>(null);
    // Slide numbers the user wants in the exported PDF. Default is every
    // slide in the deck; user can uncheck individual thumbnails.
    const [selectedSlides, setSelectedSlides] = useState<Set<number>>(
        () => new Set(SLIDES.map((sl) => sl.n))
    );
    const syncStarted = useRef(false);
    const stackRef = useRef<HTMLDivElement | null>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

    function toggleSlide(n: number) {
        setSelectedSlides((prev) => {
            const next = new Set(prev);
            if (next.has(n)) next.delete(n);
            else next.add(n);
            return next;
        });
    }
    function selectAll() {
        setSelectedSlides(new Set(SLIDES.map((sl) => sl.n)));
    }
    function selectNone() {
        setSelectedSlides(new Set());
    }
    function invertSelection() {
        setSelectedSlides((prev) => {
            const next = new Set<number>();
            for (const sl of SLIDES) if (!prev.has(sl.n)) next.add(sl.n);
            return next;
        });
    }

    useEffect(() => {
        if (syncStarted.current) return;
        syncStarted.current = true;
        // By-id mode: seed once from the persisted payload and stay standalone so
        // the export is a complete, deterministic snapshot (no dependency on a
        // live admin tab / localStorage). Otherwise hydrate from the live session.
        if (initialBroadcast) {
            usePresentationStore.getState().syncFromAdmin(initialBroadcast);
            return;
        }
        return startPresenterSync();
    }, [initialBroadcast]);

    useEffect(() => {
        setSanityData({ floorplans, stories, completedProperties });
    }, [floorplans, stories, completedProperties, setSanityData]);

    // Seed DB-backed catalog data (inclusions for Slide 4, tax topics, etc.) so
    // the by-id export matches the standalone present-v2/[id] deck.
    useEffect(() => {
        if (
            inclusionsCatalog !== undefined ||
            inclusionsSidebar !== undefined ||
            taxTopicsCatalog !== undefined ||
            citiesCatalog !== undefined ||
            discountsCatalog !== undefined
        ) {
            setCatalogData({
                ...(inclusionsCatalog !== undefined ? { inclusionsCatalog } : {}),
                ...(inclusionsSidebar !== undefined ? { inclusionsSidebar } : {}),
                ...(taxTopicsCatalog !== undefined ? { taxTopicsCatalog } : {}),
                ...(citiesCatalog !== undefined ? { citiesCatalog } : {}),
                ...(discountsCatalog !== undefined ? { discountsCatalog } : {}),
            });
        }
    }, [inclusionsCatalog, inclusionsSidebar, taxTopicsCatalog, citiesCatalog, discountsCatalog, setCatalogData]);

    useEffect(() => {
        setPrintMode(true);
        return () => setPrintMode(false);
    }, [setPrintMode]);

    useEffect(() => {
        if (storyOverridden) return;
        const visible = featuredStoryIds.length > 0
            ? storeStories.filter((st) => featuredStoryIds.includes(st._id))
            : storeStories.filter((st) => st.featured);
        const pool = visible.length > 0 ? visible : storeStories;
        const story = selectStory(customerMotivation, pool);
        setSelectedStory(story);
    }, [customerMotivation, storeStories, storyOverridden, featuredStoryIds, setSelectedStory]);

    useEffect(() => {
        const t = setTimeout(() => setPhase({ state: "ready" }), SETTLE_MS);
        return () => clearTimeout(t);
    }, []);

    async function exportPdf(target: "download" | "pipedrive" = "download") {
        if (target === "pipedrive") {
            setPdSaveState("saving");
            setPdError(null);
            setPdNote(null);
        }
        // Build the capture list from the user's selection. Each entry pairs
        // the actual <div> with its slide-number metadata so we can still
        // restore inline styles to ALL slides (not just selected ones) in
        // the finally block.
        const allEls = (slideRefs.current.filter(Boolean) as HTMLDivElement[]);
        const slides = allEls.filter((_, i) => selectedSlides.has(SLIDES[i].n));
        if (slides.length === 0) {
            window.alert("Select at least one slide to export.");
            return;
        }
        // Save the CSS-variable transform state so we can restore it after.
        const stack = stackRef.current;
        const prevScale = stack?.style.getPropertyValue("--preview-scale") || "";

        // Force every slide to render at native 1920×1080 with no transform
        // and no compensating margin. Using inline `transform: none` (rather
        // than scale(1)) takes the element out of a transform context entirely,
        // which matters because html2canvas's geometry math is unreliable when
        // any ancestor has a transform applied. The same goes for margin —
        // the negative margin-bottom we use for the preview must be zeroed
        // out so the slide's offsetHeight matches its declared 1080px.
        const inlineOriginals = slides.map((el) => ({
            transform: el.style.transform,
            marginBottom: el.style.marginBottom,
            width: el.style.width,
            height: el.style.height,
            overflow: el.style.overflow,
            background: el.style.background,
        }));
        // Track inner-slide overrides separately so we can restore them too.
        const innerOriginals = slides.map((el) => {
            const inner = el.firstElementChild as HTMLElement | null;
            return inner
                ? {
                      el: inner,
                      transform: inner.style.transform,
                      transformOrigin: inner.style.transformOrigin,
                  }
                : null;
        });

        slides.forEach((el) => {
            el.style.transform = "none";
            el.style.marginBottom = "0";
            el.style.width = "1920px";
            el.style.height = "1080px";
            el.style.overflow = "hidden";

            // Outline (the gold ring) lives in the layout box; remove for capture.
            el.style.outline = "none";

            // Match the slide-frame background to the slide's own background so
            // any letterbox bars from auto-fit blend in seamlessly (relevant for
            // light-paper slides where the default dark-teal frame would show
            // as ugly side bars).
            const inner = el.firstElementChild as HTMLElement | null;
            if (inner) {
                const cs = window.getComputedStyle(inner);
                if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
                    el.style.background = cs.backgroundColor;
                }
            }
        });
        if (stack) {
            stack.style.setProperty("--preview-scale", "1");
            void stack.offsetHeight; // commit
        }
        // Wait two frames so the browser commits the new layout before the
        // first html2canvas pass reads geometry.
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));

        try {
            setPhase({ state: "rendering", current: 0, total: SLIDES.length });

            // 13.333in × 7.5in is exactly 16:9 — matches the slide aspect.
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "in",
                format: [13.333, 7.5],
                compress: true,
            });
            const pageW = 13.333;
            const pageH = 7.5;

            for (let i = 0; i < slides.length; i++) {
                const el = slides[i];
                setPhase({ state: "rendering", current: i + 1, total: slides.length });

                // Yield so the toolbar text updates before the heavy capture.
                // eslint-disable-next-line no-await-in-loop
                await new Promise((r) => requestAnimationFrame(r));

                // ── Auto-fit overflow ─────────────────────────────────────
                // Some slides (e.g. Payment Schedule with many milestone rows)
                // lay out slightly taller than 1080px. The presenter clips
                // them via overflow:hidden so it's invisible on-stage, but
                // in the PDF the bottom would be chopped off. Detect overflow
                // and apply a uniform scale to the inner element so it fits.
                const inner = el.firstElementChild as HTMLElement | null;
                if (inner) {
                    inner.style.transform = "none";
                    // Force a reflow so scrollHeight reads the natural value.
                    void inner.offsetHeight;
                    const natural = inner.scrollHeight;
                    if (natural > 1080) {
                        const fit = 1080 / natural;
                        inner.style.transform = `scale(${fit})`;
                        inner.style.transformOrigin = "top center";
                    }
                }
                // Wait one frame so layout commits before capture.
                // eslint-disable-next-line no-await-in-loop
                await new Promise((r) => requestAnimationFrame(r));

                // Don't pass width/height — html2canvas reads them from the
                // element directly (1920×1080 set above). Passing them as
                // options can trigger html2canvas to render the full content
                // height (including overflow) and then squash/clip into the
                // requested size, which is what was chopping bottoms.
                // eslint-disable-next-line no-await-in-loop
                const canvas = await html2canvas(el, {
                    scale: 2,
                    backgroundColor: null,    // use the slideFrame's bg (set above)
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    windowWidth: 1920,
                    windowHeight: 1080,
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.92);
                if (i > 0) pdf.addPage([pageW, pageH], "landscape");
                // Use the canvas's actual aspect ratio to derive width. If
                // the canvas came back slightly off-ratio for any reason we
                // letterbox by width so nothing is cropped vertically.
                const imgRatio = canvas.width / canvas.height;
                const fitH = pageH;
                const fitW = Math.min(pageW, fitH * imgRatio);
                const offsetX = (pageW - fitW) / 2;
                pdf.addImage(imgData, "JPEG", offsetX, 0, fitW, fitH, undefined, "FAST");
            }

            const lastName = (customerName.trim().split(/\s+/).pop() ?? "Customer");
            const safeAddress = propertyAddress
                .replace(/[^a-z0-9]+/gi, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 60) || "proposal";
            const filename = `BackyardEstates-${lastName}-${safeAddress}.pdf`;

            if (target === "pipedrive") {
                // Upload the deck PDF + post a Pipedrive note via the API.
                if (!proposalId) {
                    setPdSaveState("error");
                    setPdError("No proposal id — open from the proposal tool to save to Pipedrive.");
                } else {
                    const blob = pdf.output("blob");
                    const fd = new FormData();
                    fd.append("file", new File([blob], filename, { type: "application/pdf" }));
                    const res = await fetch(`/api/proposals/${proposalId}/proposal-pdf`, {
                        method: "POST",
                        body: fd,
                    });
                    const d = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        setPdSaveState("error");
                        setPdError(d?.error || `Save failed (HTTP ${res.status})`);
                    } else {
                        setPdNote(d?.pipedriveNote ?? null);
                        setPdSaveState("saved");
                    }
                }
                // Return the deck preview to its ready state (not "in Downloads").
                setPhase({ state: "ready" });
            } else {
                pdf.save(filename);
                setPhase({ state: "done" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setPhase({ state: "error", message });
            if (target === "pipedrive") {
                setPdSaveState("error");
                setPdError(message);
            }
        } finally {
            // Restore inline styles on each slide.
            slides.forEach((el, i) => {
                const o = inlineOriginals[i];
                el.style.transform = o.transform;
                el.style.marginBottom = o.marginBottom;
                el.style.width = o.width;
                el.style.height = o.height;
                el.style.overflow = o.overflow;
                el.style.background = o.background;
                el.style.outline = "";
            });
            // Restore the inner-slide transform/origin we may have set for
            // auto-fit overflow handling during capture.
            innerOriginals.forEach((entry) => {
                if (!entry) return;
                entry.el.style.transform = entry.transform;
                entry.el.style.transformOrigin = entry.transformOrigin;
            });
            // Restore the preview scale on the stack.
            if (stack) {
                if (prevScale) stack.style.setProperty("--preview-scale", prevScale);
                else stack.style.removeProperty("--preview-scale");
            }
        }
    }

    const statusText = (() => {
        switch (phase.state) {
            case "loading":   return "Rendering slides…";
            case "ready":     return `Ready. ${selectedSlides.size} of ${SLIDES.length} slides selected.`;
            case "rendering": return `Capturing slide ${phase.current} of ${phase.total}…`;
            case "done":      return "Done — your PDF should be in Downloads.";
            case "error":     return `Failed: ${phase.message}`;
        }
    })();

    const busy = phase.state === "loading" || phase.state === "rendering";

    return (
        <div className={s.shell}>
            <div className={s.toolbar}>
                <strong>PDF Export</strong>
                <span className={s.counter}>
                    <span className={s.counterNum}>{selectedSlides.size}</span>
                    <span>/ {SLIDES.length} selected</span>
                </span>
                <span className={s.status}>
                    {pdSaveState === "error" && pdError
                        ? pdError
                        : pdSaveState === "saved" && pdNote === "no-link"
                            ? "Saved — but no Pipedrive deal is linked to this proposal."
                            : pdSaveState === "saved" && pdNote === "not-configured"
                                ? "Saved — Pipedrive is not configured."
                                : pdSaveState === "saved" && pdNote === "failed"
                                    ? "Saved — but the Pipedrive note failed to post."
                                    : pdSaveState === "saved" && pdNote === "posted"
                                        ? "Saved & note posted to Pipedrive."
                                        : statusText}
                </span>
                <div className={s.toolbarRight}>
                    <button
                        type="button"
                        className={s.toolbarBtn}
                        onClick={selectAll}
                        disabled={busy}
                    >
                        Select all
                    </button>
                    <button
                        type="button"
                        className={s.toolbarBtn}
                        onClick={selectNone}
                        disabled={busy}
                    >
                        None
                    </button>
                    <button
                        type="button"
                        className={s.toolbarBtn}
                        onClick={invertSelection}
                        disabled={busy}
                    >
                        Invert
                    </button>
                    <span className={s.toolbarSep} />
                    <button
                        type="button"
                        className={s.toolbarBtn}
                        onClick={() => exportPdf("download")}
                        disabled={busy || pdSaveState === "saving" || selectedSlides.size === 0}
                        title="Build the PDF and download it to this device"
                    >
                        {phase.state === "done" ? "Download again" : `Download PDF (${selectedSlides.size})`}
                    </button>
                    {proposalId && (
                        <button
                            type="button"
                            className={s.printBtn}
                            onClick={() => exportPdf("pipedrive")}
                            disabled={busy || pdSaveState === "saving" || selectedSlides.size === 0}
                            title="Build the PDF, store it, and post a note with the link to the linked Pipedrive deal"
                        >
                            {pdSaveState === "saving"
                                ? "Saving…"
                                : pdSaveState === "saved"
                                    ? (pdNote === "posted" ? "Saved + noted ✓" : "Saved ✓")
                                    : "Save to Pipedrive"}
                        </button>
                    )}
                </div>
            </div>

            <div className={s.stack} ref={stackRef}>
                {SLIDES.map(({ n, Component }, i) => {
                    const isSelected = selectedSlides.has(n);
                    return (
                        <div key={n} className={s.slideRow}>
                            <label
                                className={`${s.sideBadge} ${isSelected ? s.sideBadgeIncluded : s.sideBadgeExcluded}`}
                                onClick={(e) => e.stopPropagation()}
                                title={isSelected
                                    ? `Slide ${n} — included in PDF. Click to exclude.`
                                    : `Slide ${n} — excluded from PDF. Click to include.`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSlide(n)}
                                    className={s.sideBadgeCheckbox}
                                />
                                <span className={s.sideBadgeNum}>{String(n).padStart(2, "0")}</span>
                                <span className={s.sideBadgeLabel}>
                                    {isSelected ? "Included" : "Excluded"}
                                </span>
                            </label>
                            <div className={s.slideWrap}>
                                <div
                                    className={`${s.slideFrame} ${!isSelected ? s.slideFrameDeselected : ""}`}
                                    onClick={() => toggleSlide(n)}
                                    role="button"
                                    aria-pressed={isSelected}
                                    title="Click to toggle inclusion"
                                    ref={(el) => { slideRefs.current[i] = el; }}
                                >
                                    <Component />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
