// components/IncludedPills/IncludedPills.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./IncludedPills.module.css";
type ItemSelectionState = "unknown" | "might_apply" | "not_apply" | "selected" | "not_selected";

/* =========================
   Types
========================= */

type PillTone = "included" | "upgrade" | "site";

/** Category-mode pill (Design / Permits / Construction...) */
export type CategoryModal = {
    overview: string;
    highlights?: { title: string; detail?: string }[];
    sections?: Array<{
        title: string;
        kind: "bullets" | "faq" | "notes" | "cost" | "steps";
        items?: string[];
        cost?: { min: number; max: number; display: string };
    }>;
    ctas?: Array<{ label: string; hint?: string }>;
};

export type CategoryPill = {
    id: string;
    category: string;
    title: string;
    description: string;
    tone: PillTone;
    order?: number;
    modal: CategoryModal;
};

/** Item-mode pill (Kitchen Island / Water Meter / Electrical Panel...) */
export type ItemModal = {
    overview: string;
    whatsIncluded?: string[];
    whyItMatters?: string;
    commonQuestions?: string[];
    notes?: string[];

    // Site-specific extras
    estCost?: { min: number; max: number; display: string };
    howWeAssess?: string[];
    avoidIfPossible?: { title: string; detail?: string }[];
    triggers?: { key: string; title: string }[];
};

export type ItemPill = {
    id: string;
    group: string; // optional_upgrades | site_specific | etc.
    title: string;
    description: string;
    /** optional override for styling; if omitted we infer from group */
    tone?: PillTone;
    modal: ItemModal;
};

/** Discriminated union props */
type Props =
    | {
        mode: "category";
        heading?: string;
        subheading?: string;
        categories: CategoryPill[];
    }
    | {
        mode: "item";
        heading?: string;
        subheading?: string;
        items: ItemPill[];
        /** optional: lock tone for all pills in this instance */
        tone?: Exclude<PillTone, "included"> | PillTone;
        getState?: (item: ItemPill) => ItemSelectionState;
        onSetState?: (item: ItemPill, next: ItemSelectionState) => void;
    };

/* =========================
   Utilities
========================= */

function useBodyScrollLock(isLocked: boolean) {
    useEffect(() => {
        if (!isLocked) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isLocked]);
}

function inferToneFromGroup(group?: string): PillTone {
    const g = (group ?? "").toLowerCase();
    if (g.includes("upgrade")) return "upgrade";
    if (g.includes("site")) return "site";
    return "included";
}

const toneLabel: Record<PillTone, string> = {
    included: "Included",
    upgrade: "Optional Upgrade",
    site: "Site-Specific",
};

/* =========================
   Component
========================= */

export default function IncludedPills(props: Props) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);

    const isCategoryMode = props.mode === "category";

    const active = useMemo(() => {
        if (props.mode === "category") {
            return props.categories.find((c) => c.id === activeId) ?? null;
        }
        return props.items.find((i) => i.id === activeId) ?? null;
    }, [props, activeId]);

    useBodyScrollLock(!!active);

    const close = () => setActiveId(null);

    // ESC closes
    useEffect(() => {
        if (!active) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [active]);

    // focus close on open
    useEffect(() => {
        if (!active) return;
        closeBtnRef.current?.focus();
    }, [active]);

    return (
        <section className={styles.wrap}>
            {(props.heading || props.subheading) && (
                <header className={styles.header}>
                    {props.heading && <h2 className={styles.heading}>{props.heading}</h2>}
                    {props.subheading && <p className={styles.subheading}>{props.subheading}</p>}
                </header>
            )}

            {/* =========================
          PILL LIST (two modes)
      ========================== */}
            {props.mode === "category" ? (
                <CategoryPillRow categories={props.categories} activeId={activeId} onOpen={setActiveId} />
            ) : (
                <ItemPillRow
                    items={props.items}
                    tone={props.tone}
                    activeId={activeId}
                    onOpen={setActiveId}
                    getState={(props as any).getState}
                />
            )}

            {/* =========================
          MODAL (two modes)
      ========================== */}
            {active ? (
                <div
                    className={styles.overlay}
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) close();
                    }}
                >
                    <div
                        id="included-modal"
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="included-modal-title"
                    >
                        {isCategoryMode ? (
                            <CategoryModalView
                                active={active as CategoryPill}
                                closeBtnRef={closeBtnRef}
                                onClose={close}
                            />
                        ) : (
                            <ItemModalView
                                active={active as ItemPill}
                                forcedTone={(props as any).tone}
                                closeBtnRef={closeBtnRef}
                                onClose={close}
                                getState={(props as any).getState}
                                onSetState={(props as any).onSetState}
                            />
                        )}


                    </div>
                </div>
            ) : null}
        </section>
    );
}

/* =========================
   Category mode views
========================= */

function CategoryPillRow({
    categories,
    activeId,
    onOpen,
}: {
    categories: CategoryPill[];
    activeId: string | null;
    onOpen: (id: string) => void;
}) {
    const sorted = useMemo(
        () => [...categories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
        [categories]
    );

    return (
        <div className={styles.categoryRow}>
            {sorted.map((cat) => (
                <button
                    key={cat.id}
                    type="button"
                    className={`${styles.categoryPill} ${styles[`tone_${cat.tone}`]}`}
                    onClick={() => onOpen(cat.id)}
                    aria-haspopup="dialog"
                    aria-expanded={activeId === cat.id}
                    aria-controls="included-modal"
                    title={cat.description}
                >
                    <div className={styles.categoryTop}>
                        <div className={styles.categoryTitleWrap}>
                            <span className={styles.categoryDot} aria-hidden="true" />
                            <span className={styles.categoryTitle}> {cat.title}</span>
                        </div>

                        <span className={styles.categoryTag}>{toneLabel[cat.tone]}</span>

                    </div>

                    <div className={styles.categoryMeta}>
                        <span className={styles.categoryDesc}>{cat.description}</span>
                    </div>
                </button>
            ))}
        </div>
    );
}

function CategoryModalView({
    active,
    closeBtnRef,
    onClose,
}: {
    active: CategoryPill;
    closeBtnRef: React.RefObject<HTMLButtonElement | null>;
    onClose: () => void;
}) {
    return (
        <>
            <div className={styles.modalHeader}>
                <div className={styles.modalHeaderLeft}>
                    <div className={`${styles.badge} ${styles[`badge_${active.tone}`]}`}>
                        <span className={styles.badgeDot} aria-hidden="true" />
                        {toneLabel[active.tone]}
                    </div>

                    <h3 id="included-modal-title" className={styles.modalTitle}>
                        {active.title}
                    </h3>

                    <p className={styles.modalSubtitle}>{active.description}</p>
                </div>

                <button
                    ref={closeBtnRef}
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Close"
                >
                    <span aria-hidden="true">✕</span>
                </button>
            </div>

            <div className={styles.modalBody}>
                <section className={styles.heroCard}>
                    <div className={styles.heroKicker}>Overview</div>
                    <p className={styles.heroText}>{active.modal.overview}</p>
                </section>

                {active.modal.sections?.length ? (
                    <div className={styles.sectionGrid}>
                        {active.modal.sections.map((s, idx) => (
                            <section key={idx} className={styles.sectionCard}>
                                <div className={styles.sectionHeader}>
                                    <h4 className={styles.sectionTitle}>{s.title}</h4>
                                    {s.kind === "cost" && s.cost ? (
                                        <div className={styles.costPill}>{s.cost.display}</div>
                                    ) : null}
                                </div>

                                {s.kind === "cost" && s.cost ? (
                                    <div className={styles.costBody}>
                                        <div className={styles.costRow}>
                                            <span className={styles.costLabel}>Estimated Range</span>
                                            <span className={styles.costValue}>{s.cost.display}</span>
                                        </div>
                                        <p className={styles.sectionText}>
                                            This varies by property and jurisdiction. We surface it upfront so budget and timeline stay
                                            predictable.
                                        </p>
                                    </div>
                                ) : null}

                                {s.items?.length ? (
                                    <ul className={styles.cleanList}>
                                        {s.items.map((item, i) => (
                                            <li key={i} className={styles.cleanItem}>
                                                <span className={styles.bullet} aria-hidden="true">
                                                    {s.kind === "faq" ? "?" : "✓"}
                                                </span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </section>
                        ))}
                    </div>
                ) : null}

                {active.modal.ctas?.length ? (
                    <section className={styles.ctaRow}>
                        {active.modal.ctas.map((cta, idx) => (
                            <button key={idx} type="button" className={styles.ctaBtn}>
                                <span className={styles.ctaLabel}>{cta.label}</span>
                                {cta.hint ? <span className={styles.ctaHint}>{cta.hint}</span> : null}
                            </button>
                        ))}
                    </section>
                ) : null}
            </div>
        </>
    );
}

/* =========================
   Item mode views
========================= */

function ItemPillRow({
    items,
    tone,
    activeId,
    onOpen,
    getState,
}: {
    items: ItemPill[];
    tone?: PillTone;
    activeId: string | null;
    onOpen: (id: string) => void;

    // ✅ NEW
    getState?: (item: ItemPill) => ItemSelectionState;
}) {
    const sorted = useMemo(() => [...items].sort((a, b) => a.title.localeCompare(b.title)), [items]);

    return (
        <div className={styles.itemRow}>
            {sorted.map((item) => {
                const t = tone ?? item.tone ?? inferToneFromGroup(item.group);
                const state = getState?.(item) ?? "unknown";

                const isApplied = state === "might_apply" || state === "selected";
                const isRejected = state === "not_apply";

                return (
                    <button
                        key={item.id}
                        type="button"
                        className={[
                            styles.itemPill,
                            styles[`tone_${t}`],
                            isApplied ? styles.itemPillSelected : "",
                            isRejected ? styles.itemPillRejected : "",
                        ].join(" ")}
                        onClick={() => onOpen(item.id)}
                        aria-haspopup="dialog"
                        aria-expanded={activeId === item.id}
                        aria-controls="included-modal"
                        title={item.description}
                    >
                        <span className={styles.itemIcon} aria-hidden="true">
                            {t === "included" ? "✓" : t === "upgrade" ? "＋" : "!"}
                        </span>

                        <span className={styles.itemText}>
                            <span className={styles.itemTitle}>{item.title}</span>
                            <span className={styles.itemSub}>
                                {t === "upgrade" ? "Optional" : t === "site" ? "Varies by site" : "Included"}
                            </span>
                        </span>

                        {/* ✅ NEW visual indicator */}
                        {isApplied ? <span className={styles.stateBadge}>Added</span> : null}
                        {isRejected ? <span className={styles.stateBadgeMuted}>Not likely</span> : null}
                    </button>
                );
            })}
        </div>
    );
}


function ItemModalView({
    active,
    forcedTone,
    closeBtnRef,
    onClose,// ✅ NEW
    getState,
    onSetState,
}: {
    active: ItemPill;
    forcedTone?: PillTone;
    closeBtnRef: React.RefObject<HTMLButtonElement | null>;
    onClose: () => void;

    getState?: (item: ItemPill) => ItemSelectionState;
    onSetState?: (item: ItemPill, next: ItemSelectionState) => void;
}) {
    const t = forcedTone ?? active.tone ?? inferToneFromGroup(active.group);
    const state = getState?.(active) ?? (t === "upgrade" ? "not_selected" : "unknown");

    const isUpgrade = t === "upgrade";
    const isSite = t === "site";

    return (
        <>
            <div className={styles.modalHeader}>
                <div className={styles.modalHeaderLeft}>
                    <div className={`${styles.badge} ${styles[`badge_${t}`]}`}>
                        <span className={styles.badgeDot} aria-hidden="true" />
                        {toneLabel[t]}
                    </div>

                    <h3 id="included-modal-title" className={styles.modalTitle}>
                        {active.title}
                    </h3>

                    <p className={styles.modalSubtitle}>{active.description}</p>
                </div>

                <button
                    ref={closeBtnRef}
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Close"
                >
                    <span aria-hidden="true">✕</span>
                </button>
            </div>

            <div className={styles.modalBody}>

                {/* Hero overview */}
                <section className={styles.heroCard}>
                    <div className={styles.heroKicker}>Overview</div>
                    <p className={styles.heroText}>{active.modal.overview}</p>
                </section>

                {/* Site-specific “Estimated cost” + “How we assess” */}
                {t === "site" && active.modal.estCost ? (
                    <div className={styles.sectionGrid}>
                        <section className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <h4 className={styles.sectionTitle}>Estimated Range</h4>
                                <div className={styles.costPill}>{active.modal.estCost.display}</div>
                            </div>
                            <div className={styles.costBody}>
                                <p className={styles.sectionText}>
                                    This varies by property and jurisdiction. We confirm requirements early to protect your budget.
                                </p>
                            </div>
                        </section>

                        {active.modal.howWeAssess?.length ? (
                            <section className={styles.sectionCard}>
                                <div className={styles.sectionHeader}>
                                    <h4 className={styles.sectionTitle}>How we assess it upfront</h4>
                                </div>
                                <ul className={styles.cleanList}>
                                    {active.modal.howWeAssess.map((s, idx) => (
                                        <li key={idx} className={styles.cleanItem}>
                                            <span className={styles.bullet} aria-hidden="true">
                                                ✓
                                            </span>
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}
                    </div>
                ) : null}

                {/* “What’s included” (upgrades may use this as “What you get”) */}
                {active.modal.whatsIncluded?.length ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>
                                {t === "upgrade" ? "What you get with this upgrade" : "What’s included"}
                            </h4>
                        </div>
                        <ul className={styles.cleanList}>
                            {active.modal.whatsIncluded.map((x, idx) => (
                                <li key={idx} className={styles.cleanItem}>
                                    <span className={styles.bullet} aria-hidden="true">
                                        ✓
                                    </span>
                                    <span>{x}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {/* Why it matters */}
                {active.modal.whyItMatters ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>Why it matters</h4>
                        </div>
                        <p className={styles.sectionText}>{active.modal.whyItMatters}</p>
                    </section>
                ) : null}

                {/* Triggers */}
                {active.modal.triggers?.length ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>Common triggers</h4>
                        </div>
                        <div className={styles.chipRow}>
                            {active.modal.triggers.map((tr) => (
                                <span key={tr.key} className={styles.chip}>
                                    {tr.title}
                                </span>
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* FAQs */}
                {active.modal.commonQuestions?.length ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>Common questions</h4>
                        </div>
                        <ul className={styles.cleanList}>
                            {active.modal.commonQuestions.map((q, idx) => (
                                <li key={idx} className={styles.cleanItem}>
                                    <span className={styles.bullet} aria-hidden="true">
                                        ?
                                    </span>
                                    <span>{q}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {/* Notes */}
                {active.modal.notes?.length ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>Notes</h4>
                        </div>
                        <ul className={styles.cleanList}>
                            {active.modal.notes.map((n, idx) => (
                                <li key={idx} className={styles.cleanItem}>
                                    <span className={styles.bullet} aria-hidden="true">
                                        •
                                    </span>
                                    <span>{n}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </div>
            <div className={styles.modalFooter}>
                {/* ✅ NEW: selection action strip (top of modal body is fine) */}
                {(isSite || isUpgrade) && onSetState ? (
                    <div className={styles.actionRow}>
                        {isSite ? (
                            <>
                                <button
                                    type="button"
                                    className={
                                        `${state === "might_apply" ? styles.primaryBtn : styles.secondaryBtn}`
                                    }
                                    onClick={() => onSetState(active, "might_apply")}
                                >
                                    This might apply
                                </button>

                                <button
                                    type="button"
                                    className={
                                        `${state === "not_apply" ? styles.primaryBtn : styles.secondaryBtn}`
                                    }
                                    onClick={() => onSetState(active, "not_apply")}
                                >
                                    Might not apply
                                </button>

                                {state !== "unknown" ? (
                                    <button
                                        type="button"
                                        className={styles.ghostBtn}
                                        onClick={() => onSetState(active, "unknown")}
                                    >
                                        Clear
                                    </button>
                                ) : null}
                            </>
                        ) : (
                            <>
                                {state === "selected" ? (
                                    <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        onClick={() => onSetState(active, "not_selected")}
                                    >
                                        Remove upgrade
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.primaryBtn}
                                        onClick={() => onSetState(active, "selected")}
                                    >
                                        Add upgrade
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ) : null}
            </div>
        </>
    );
}
