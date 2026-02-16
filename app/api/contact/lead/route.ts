import { NextResponse } from "next/server"

type Intent = "INTRO_CALL" | "OFFICE_CONSULT" | "MESSAGE"

function digitsOnly(v: string) {
    return (v ?? "").replace(/\D/g, "")
}

function requireEnv(name: string) {
    const v = process.env[name]
    if (!v) throw new Error(`Missing env var: ${name}`)
    return v
}

function buildPipedriveUrl(path: string) {
    const domain = requireEnv("NEXT_PUBLIC_PIPEDRIVE_DOMAIN")
    const token = requireEnv("NEXT_PUBLIC_PIPEDRIVE_API_TOKEN")
    return `https://${domain}.pipedrive.com/v1/${path}?api_token=${token}`
}

/**
 * ✅ IMPORTANT: Replace these IDs with YOUR real field keys
 * The ones below are from your existing form.
 */
const PD_FIELDS = {
    // Person custom fields (consents)
    PERSON_EMAIL_CONSENT: "733d97610511293c521189a69a776c732bae881c",
    PERSON_TEXT_CONSENT: "3397c6015c59f81b73082a78efb98a6bcc88b258",

    // Deal custom fields
    DEAL_SOURCE: "fd49bc4881f7bdffdeaa1868171df24bea5925fe",
    DEAL_ADDRESS: "47f338d18c478ccd45a1b19afb8629561a7f714e",
    DEAL_EMAIL_CONSENT: "733d97610511293c521189a69a776c732bae881c",
    DEAL_TEXT_CONSENT: "3397c6015c59f81b73082a78efb98a6bcc88b258",


    // Optional: if you have a “message/notes” custom field on deal, put it here:
    DEAL_MESSAGE: "015bdaea2150906c2ff3bf0040107c1ccb8de987",
}

function mapIntentToDealMeta(intent: Intent) {
    /**
     * ✅ You can change these anytime without touching UI.
     * - sourceNumber maps to your "lead source" field options.
     * - pipeline_id/stage_id are optional; only set if you want these routed.
     */
    switch (intent) {
        case "INTRO_CALL":
            return {
                sourceNumber: 56, // default / website (or your preferred value)
                pipeline_id: undefined,
                stage_id: undefined,
            }
        case "OFFICE_CONSULT":
            return {
                sourceNumber: 56,
                pipeline_id: undefined,
                stage_id: undefined,
            }
        case "MESSAGE":
            return {
                sourceNumber: 56,
                pipeline_id: undefined,
                stage_id: undefined,
            }
        default:
            return { sourceNumber: 56, pipeline_id: undefined, stage_id: undefined }
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const intent = (body?.intent ?? body?.flow ?? "INTRO_CALL") as Intent
        const contact = body?.contact ?? {}

        const firstName = (contact.firstName ?? "").trim()
        const lastName = (contact.lastName ?? "").trim()
        const name = (contact.name ?? `${firstName} ${lastName}`).trim()
        const email = (contact.email ?? "").trim()
        const phoneDigits = digitsOnly(contact.phone ?? "")

        const address = contact.address ?? {}
        const street = (address.street ?? "").trim()
        const city = (address.city ?? "").trim()
        const zip = (address.zip ?? "").trim()
        const addressString = [street, city, "CA", zip].filter(Boolean).join(", ")

        const consentEmail = contact.consentEmail ?? "unsubscribed"
        const consentText = contact.consentText ?? "unsubscribed"
        const message = (contact.message ?? "").trim()

        // --- 1) Create Person ---
        const personPayload: any = {
            name,
            email: email ? [{ value: email }] : [],
            phone: phoneDigits ? [{ value: phoneDigits }] : [],
            [PD_FIELDS.PERSON_EMAIL_CONSENT]: consentEmail,
            [PD_FIELDS.PERSON_TEXT_CONSENT]: consentText,
        }

        const personRes = await fetch(buildPipedriveUrl("persons"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(personPayload),
        })

        const personData = await personRes.json()

        if (!personRes.ok || personData?.success === false) {
            return NextResponse.json(
                { success: false, step: "create_person", pipedrive: personData },
                { status: 400 }
            )
        }

        const personId = personData?.data?.id
        if (!personId) {
            return NextResponse.json(
                { success: false, step: "create_person", error: "Missing person id" },
                { status: 400 }
            )
        }

        // --- 2) Create Deal (Lead) ---
        const meta = mapIntentToDealMeta(intent)

        const dealPayload: any = {
            title: name || "New Lead",
            person_id: personId,
            [PD_FIELDS.DEAL_SOURCE]: meta.sourceNumber,
            [PD_FIELDS.DEAL_ADDRESS]: addressString,

            ...(meta.pipeline_id ? { pipeline_id: meta.pipeline_id } : {}),
            ...(meta.stage_id ? { stage_id: meta.stage_id } : {}),
        }

        // If you have a deal “message” custom field, set it here:
        if (PD_FIELDS.DEAL_MESSAGE) dealPayload[PD_FIELDS.DEAL_MESSAGE] = message

        const dealRes = await fetch(buildPipedriveUrl("deals"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dealPayload),
        })

        const dealData = await dealRes.json()

        if (!dealRes.ok || dealData?.success === false) {
            return NextResponse.json(
                {
                    success: false,
                    step: "create_deal",
                    personId,
                    pipedrive: dealData,
                },
                { status: 400 }
            )
        }

        const dealId = dealData?.data?.id

        return NextResponse.json(
            {
                success: true,
                personId,
                dealId,
                intent,
                // handy for your frontend redirect prefill
                prefill: { name, email, phone: phoneDigits, address: addressString },
            },
            { status: 200 }
        )
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message ?? "Unknown error" },
            { status: 500 }
        )
    }
}
