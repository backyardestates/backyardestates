// Clean-fetch a customer's contact + address from Pipedrive so reps never
// retype what the CRM already knows. Resolves a person from an explicit person
// id or (for deal-started engagements) from the deal's linked person, then
// pulls the primary email/phone and the structured postal address.

import { pipedriveFetch } from "./client";

// Pipedrive deal custom field "Address" — the property address reps enter on the
// office-consultation lead form. Written by app/api/contact/lead (DEAL_ADDRESS)
// and app/api/send. Stored as a free string, typically "street, city, CA, zip".
const DEAL_ADDRESS_FIELD = "47f338d18c478ccd45a1b19afb8629561a7f714e";

interface PdLabeledValue {
    value: string;
    primary?: boolean;
}

interface PdPerson {
    id: number;
    name: string | null;
    email?: PdLabeledValue[] | null;
    phone?: PdLabeledValue[] | null;
    // Pipedrive geocodes addresses into these subfields when available.
    postal_address?: string | null;
    postal_address_formatted_address?: string | null;
    postal_address_street_number?: string | null;
    postal_address_route?: string | null;
    postal_address_subpremise?: string | null;
    postal_address_locality?: string | null; // city
    postal_address_admin_area_level_1?: string | null; // state
    postal_address_postal_code?: string | null; // zip
}

interface PdDeal {
    id: number;
    title: string | null;
    person_id?: { value?: number; name?: string } | null;
}

export interface PipedriveContact {
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    addressLine1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    /** Full formatted address, used to derive the engagement's addressKey. */
    address: string | null;
    personId: number | null;
    dealId: number | null;
}

function primaryValue(arr?: PdLabeledValue[] | null): string | null {
    if (!arr || arr.length === 0) return null;
    return arr.find((x) => x.primary)?.value?.trim() || arr[0]?.value?.trim() || null;
}

// Best-effort split of the lead-form address ("street, city, CA, zip") into
// parts so the engagement displays a clean line1 + city. The full string is
// always kept as `address`, so an unparseable value still flows through.
function parseAddress(s: string): {
    line1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
} {
    const parts = s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    return {
        line1: parts[0] ?? null,
        city: parts[1] ?? null,
        state: s.match(/\b([A-Z]{2})\b/)?.[1] ?? null,
        zip: s.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] ?? null,
    };
}

/**
 * Fetch and normalize a customer's details from Pipedrive. Fails soft: any
 * lookup error resolves to nulls so engagement creation is never blocked by a
 * CRM hiccup. Pass whichever id you have — a deal id alone is enough, the
 * person is resolved from it.
 */
export async function fetchPipedriveContact(opts: {
    personId?: number | null;
    dealId?: number | null;
}): Promise<PipedriveContact> {
    const dealId = opts.dealId ?? null;
    let personId = opts.personId ?? null;
    let dealTitle: string | null = null;
    let dealAddress: string | null = null;

    if (dealId) {
        const deal = await pipedriveFetch<{ data: (PdDeal & Record<string, unknown>) | null }>(
            `deals/${dealId}`,
        ).catch(() => null);
        const dd = deal?.data ?? null;
        dealTitle = dd?.title ?? null;
        if (!personId) personId = dd?.person_id?.value ?? null;
        const raw = dd?.[DEAL_ADDRESS_FIELD];
        dealAddress = typeof raw === "string" && raw.trim() ? raw.trim() : null;
    }

    let person: PdPerson | null = null;
    if (personId) {
        const res = await pipedriveFetch<{ data: PdPerson | null }>(`persons/${personId}`).catch(
            () => null,
        );
        person = res?.data ?? null;
    }

    const personLine1 =
        [person?.postal_address_street_number, person?.postal_address_route]
            .filter(Boolean)
            .join(" ")
            .trim() || null;
    const personAddress =
        person?.postal_address_formatted_address?.trim() ||
        person?.postal_address?.trim() ||
        null;

    // Prefer the property address typed on the office-consultation form (deal
    // field); fall back to the person's geocoded postal address.
    const parsed = dealAddress ? parseAddress(dealAddress) : null;

    return {
        customerName: person?.name?.trim() || dealTitle?.trim() || null,
        customerEmail: primaryValue(person?.email),
        customerPhone: primaryValue(person?.phone),
        addressLine1: parsed?.line1 || personLine1 || dealAddress || null,
        city: parsed?.city || person?.postal_address_locality?.trim() || null,
        state: parsed?.state || person?.postal_address_admin_area_level_1?.trim() || null,
        zip: parsed?.zip || person?.postal_address_postal_code?.trim() || null,
        address: dealAddress || personAddress,
        personId,
        dealId,
    };
}
