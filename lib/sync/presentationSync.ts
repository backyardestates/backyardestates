"use client";

import { usePresentationStore, type AdminBroadcast } from "@/lib/store/presentationStore";

const CHANNEL_NAME = "be_presentation";
const LS_KEY = "be_present_state";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
    if (typeof window === "undefined") return null;
    if (!channel) {
        try { channel = new BroadcastChannel(CHANNEL_NAME); } catch { return null; }
    }
    return channel;
}

// ── Broadcast helpers ────────────────────────────────────────────────────────

export function broadcastAdminState(data: AdminBroadcast) {
    const ch = getChannel();
    if (!ch) return;
    try {
        ch.postMessage(data);
    } catch (err) {
        console.error("[presentationSync] postMessage failed:", err);
    }
    try {
        localStorage.setItem(LS_KEY, JSON.stringify({ ...data, _ts: Date.now() }));
    } catch { /* quota / private browsing */ }
}

// ── Admin-side: subscribe store → broadcast ──────────────────────────────────

let adminUnsubscribe: (() => void) | null = null;

export function startAdminSync(): () => void {
    if (adminUnsubscribe) adminUnsubscribe();

    adminUnsubscribe = usePresentationStore.subscribe((state) => {
        broadcastAdminState({
            customerName: state.customerName,
            propertyAddress: state.propertyAddress,
            aduType: state.aduType,
            propertyPhotoUrl: state.propertyPhotoUrl,
            customerMotivation: state.customerMotivation,
            comparedUnitIds: state.comparedUnitIds,
            scenarios: state.scenarios,
            rentalComps: state.rentalComps,
            rentByUnitId: state.rentByUnitId,
            paymentSchedules: state.paymentSchedules,
            siteWorkTagsByUnitId: state.siteWorkTagsByUnitId,
            siteWorkByUnitId: state.siteWorkByUnitId,
            discountLinesByUnitId: state.discountLinesByUnitId,
        });
    });

    return () => {
        adminUnsubscribe?.();
        adminUnsubscribe = null;
    };
}

// ── Presenter-side: receive broadcast → update store ────────────────────────

export function startPresenterSync(): () => void {
    const ch = getChannel();
    if (!ch) return () => {};

    // Hydrate from localStorage on first load
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            const saved = JSON.parse(raw) as AdminBroadcast & { _ts?: number };
            delete (saved as any)._ts;
            usePresentationStore.getState().syncFromAdmin(saved);
        }
    } catch { /* malformed */ }

    function handleMessage(event: MessageEvent<AdminBroadcast>) {
        usePresentationStore.getState().syncFromAdmin(event.data);
    }

    ch.addEventListener("message", handleMessage);
    return () => ch.removeEventListener("message", handleMessage);
}

// ── Convenience helpers ───────────────────────────────────────────────────────

export function syncSlide(n: number) {
    // Slide nav is local to presenter — not broadcast
    usePresentationStore.getState().setSlide(n);
}
