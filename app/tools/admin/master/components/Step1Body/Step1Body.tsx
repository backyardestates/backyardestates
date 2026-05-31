// Step 1 body — compact two-card layout.
//
//   Card 1 "Details" — customer + property + financing in ONE dense grid so
//     the whole top of the form fits above the fold. Name + motivation share
//     a row; address spans full width; mortgage + current payment share a
//     row; the Pipedrive linker is a compact full-width strip.
//   Card 2 "Units" — the comparison picker (the tall part), kept on its own
//     so reps reach it with minimal scrolling.
//
// Notable details:
//   • No tall per-section headers/dividers — each card uses a single slim
//     eyebrow row, which reclaims a lot of vertical space vs the old
//     three-card stack (Customer / Property / Units).
//   • The global aduType chips live in the Units header as "Default type".
//   • Site-photo uploader moved OUT into its own "Site Photo" step.

"use client";

import React from "react";
import type { CustomerMotivation } from "@/lib/store/presentationStore";
import { PipedriveLinkPanel } from "../PipedriveLinkPanel/PipedriveLinkPanel";
import s from "./Step1Body.module.css";

const MOTIVATIONS: { value: NonNullable<CustomerMotivation>; label: string }[] = [
    { value: "family", label: "Family" },
    { value: "income", label: "Income" },
    { value: "investment", label: "Investment" },
];

interface Props {
    // Customer
    customerName: string;
    setCustomerName: (v: string) => void;
    customerEmail: string;
    setCustomerEmail: (v: string) => void;
    customerMotivation: CustomerMotivation;
    setCustomerMotivation: (m: CustomerMotivation) => void;
    pipedrivePersonId: string | null;
    pipedriveDealId: string | null;
    setPipedrivePersonId: (n: string | null) => void;
    setPipedriveDealId: (n: string | null) => void;

    // Property
    AddressAutocomplete: React.ComponentType<any>;
    address: string;
    setAddress: (v: string) => void;
    owed: string;
    setOwed: (v: string) => void;
    currentFirstPmtMonthly: string;
    setCurrentFirstPmtMonthly: (v: string) => void;
    loading: boolean;
    error: string | null;
}

// Details step body — customer + property + financing. Owns the property-data
// pull (fired on address resolve via AddressAutocomplete). The unit comparison
// picker is its own step now; see UnitsBody.
export function Step1Body(props: Props) {
    return (
        <div className={s.root}>
            {/* ── Details: customer + property + financing ───────────── */}
            <section className={s.card}>
                <header className={s.cardHeader}>
                    <span className={s.eyebrow}>Details</span>
                    {props.loading && (
                        <span className={s.headerHint}>
                            <span className={s.spinner} aria-hidden /> Pulling property data…
                        </span>
                    )}
                </header>

                <div className={s.detailsGrid}>
                    {/* Pipedrive — full width compact strip. Kept at the top so
                        linking a person/deal first can auto-fill name + email
                        below. */}
                    <div className={s.span2}>
                        <PipedriveLinkPanel
                            pipedrivePersonId={props.pipedrivePersonId}
                            pipedriveDealId={props.pipedriveDealId}
                            seedQuery={props.customerName || props.address}
                            onChange={({ personId, dealId, email }) => {
                                props.setPipedrivePersonId(personId);
                                props.setPipedriveDealId(dealId);
                                // Auto-fill email from the linked person, but never
                                // overwrite an address the rep already typed.
                                if (email && email.trim() && !props.customerEmail.trim()) {
                                    props.setCustomerEmail(email.trim());
                                }
                            }}
                            // Fires after the linked record's email is resolved
                            // from Pipedrive — covers deal-only links (the deal
                            // result has no email) and reopened proposals.
                            onResolvedEmail={(email) => {
                                if (!props.customerEmail.trim()) props.setCustomerEmail(email);
                            }}
                        />
                    </div>

                    {/* Name */}
                    <div className={s.field}>
                        <label className={s.label} htmlFor="step1-name">Customer name</label>
                        <input
                            id="step1-name"
                            className={s.input}
                            value={props.customerName}
                            onChange={(e) => props.setCustomerName(e.target.value)}
                            placeholder="Ray & Bonnie Shouse"
                        />
                    </div>

                    {/* Motivation */}
                    <div className={s.field}>
                        <label className={s.label}>Primary motivation</label>
                        <div className={s.chips} role="radiogroup" aria-label="Customer motivation">
                            {MOTIVATIONS.map((m) => {
                                const active = props.customerMotivation === m.value;
                                return (
                                    <button
                                        key={m.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        className={`${s.chip} ${active ? s.chipActive : ""}`}
                                        onClick={() =>
                                            props.setCustomerMotivation(active ? null : m.value)
                                        }
                                    >
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Customer email — full width; drives the e-signature recipient */}
                    <div className={`${s.field} ${s.span2}`}>
                        <label className={s.label} htmlFor="step1-email">Customer email</label>
                        <input
                            id="step1-email"
                            className={s.input}
                            type="email"
                            value={props.customerEmail}
                            onChange={(e) => props.setCustomerEmail(e.target.value)}
                            placeholder="sarah@example.com"
                        />
                        <span className={s.hint}>
                            Used to send the agreement for e-signature. Auto-fills from a linked
                            Pipedrive person — you can edit it.
                        </span>
                    </div>

                    {/* Address — full width */}
                    <div className={`${s.field} ${s.span2}`}>
                        <label className={s.label}>Property address</label>
                        <props.AddressAutocomplete
                            value={props.address}
                            onChange={(v: string) => props.setAddress(v)}
                            onResolved={(d: any) => props.setAddress(d.formattedAddress)}
                            label=""
                        />
                    </div>

                    {/* Mortgage balance */}
                    <div className={s.field}>
                        <label className={s.label} htmlFor="step1-owed">Mortgage balance</label>
                        <div className={s.moneyWrap}>
                            <span className={s.moneyPrefix}>$</span>
                            <input
                                id="step1-owed"
                                className={`${s.input} ${s.inputMoney}`}
                                value={props.owed}
                                onChange={(e) => props.setOwed(e.target.value)}
                                placeholder="250,000"
                                inputMode="numeric"
                            />
                        </div>
                    </div>

                    {/* Current monthly payment */}
                    <div className={s.field}>
                        <label className={s.label} htmlFor="step1-pmt">Current monthly payment</label>
                        <div className={s.moneyWrap}>
                            <span className={s.moneyPrefix}>$</span>
                            <input
                                id="step1-pmt"
                                className={`${s.input} ${s.inputMoney}`}
                                value={props.currentFirstPmtMonthly}
                                onChange={(e) => props.setCurrentFirstPmtMonthly(e.target.value)}
                                placeholder="1,000"
                                inputMode="numeric"
                            />
                        </div>
                    </div>
                </div>

                {props.error && <div className={s.error} role="alert">{props.error}</div>}
            </section>
        </div>
    );
}
