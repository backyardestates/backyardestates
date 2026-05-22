// app/api/feasibility/submit/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/writeClient";
import { client } from "@/sanity/client";
import { generateFeasibilityPdfBytes } from "@/lib/feasibility/pdf/generatePdf";
import { Readable } from "stream";
import { COMPARABLE_PROPERTIES_QUERY, FEATURED_STORIES_QUERY, FLOORPLAN_BY_ID, REPORT_ASSETS_QUERY } from "@/sanity/queries";


const BRAND_QUERY = `
*[_type=="siteSettings"][0]{
  brandName,
  tagline,
  "logoUrl": logo.asset->url,
  "coverUrl": feasibilityCover.asset->url,
  "processUrls": processGallery[].asset->url,
  "signatureName": signatureName,
  "signatureTitle": signatureTitle
}
`;

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const readable = stream instanceof Readable ? stream : Readable.from(stream as any);
    const chunks: Buffer[] = [];
    for await (const chunk of readable) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
}

async function createPipedrivePerson(person: any) {
    const domain = process.env.PIPEDRIVE_DOMAIN;
    const token = process.env.PIPEDRIVE_API_TOKEN;

    const res = await fetch(`https://${domain}.pipedrive.com/v1/persons?api_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(person),
    });

    const json = await res.json();
    console.log("Pipedrive person create response:", json);
    if (!res.ok) throw new Error(json?.error || "Pipedrive person create failed");
    return json?.data;
}

async function createPipedriveNote(personId: number, content: string) {
    const domain = process.env.PIPEDRIVE_DOMAIN;
    const token = process.env.PIPEDRIVE_API_TOKEN;

    const res = await fetch(`https://${domain}.pipedrive.com/v1/notes?api_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: personId, content }),
    });

    const json = await res.json();
    console.log("Pipedrive Note create response:", json);

    if (!res.ok) throw new Error(json?.error || "Pipedrive note create failed");
    return json?.data;
}

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        const name = payload?.name?.trim();
        const phone = payload?.phone?.trim();
        const email = payload?.email?.trim();
        const address = payload?.address?.trim();
        const city = payload?.city?.trim();

        const motivation = payload?.motivation;
        const aduType = payload?.aduType;
        const bed = payload?.bed;
        const bath = payload?.bath;

        if (!name || !phone || !email || !address || !motivation || !aduType || bed == null || bath == null) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Enrich from Sanity
        const [brand, floorplan, reportAssets, stories, comparables] = await Promise.all([
            client.fetch(BRAND_QUERY),
            payload?.selectedFloorplanId ? client.fetch(FLOORPLAN_BY_ID, { id: payload.selectedFloorplanId }) : null,
            client.fetch(REPORT_ASSETS_QUERY),
            client.fetch(FEATURED_STORIES_QUERY),
            client.fetch(COMPARABLE_PROPERTIES_QUERY),
        ]);

        // Canonical report data object (THIS drives the PDF)
        const data = {
            brand: brand ?? null,
            contact: { name, phone, email },
            property: { address, city },
            project: { motivation, aduType, bed, bath, timeframe: payload?.timeframe ?? null },
            selections: {
                selectedFloorplanId: payload?.selectedFloorplanId ?? null,
                floorplan,
                optionalUpgrades: payload?.optionalUpgrades ?? payload?.answers?.optionalUpgrades ?? null,
                siteSpecific: payload?.siteSpecific ?? payload?.answers?.siteSpecific ?? null,
            },
            finance: payload?.finance ?? null,
            outputs: payload?.outputs ?? {},
            riskFlags: payload?.riskFlags ?? [],
            assets: {
                reportAssets: reportAssets ?? null,
                testimonials: stories ?? [],
                comparables: comparables ?? [],
            },
            raw: payload,
            generatedAt: new Date().toISOString(),
        };

        // Create a Sanity doc first (without pdf)
        const created = await writeClient.create({
            _type: "feasibilitySubmission",
            createdAt: data.generatedAt,
            status: "new",
            contact: data.contact,
            address: { full: data.property.address, city: data.property.city },
            motivation: data.project.motivation,
            aduType: data.project.aduType,
            bed: data.project.bed,
            bath: data.project.bath,
            timeframe: data.project.timeframe,
            selectedFloorplan: data.selections.selectedFloorplanId
                ? { _type: "reference", _ref: data.selections.selectedFloorplanId }
                : undefined,
            finance: data.finance,
            optionalUpgrades: data.selections.optionalUpgrades,
            siteSpecific: data.selections.siteSpecific,
            outputs: data.outputs,
            riskFlags: data.riskFlags,
            rawState: JSON.stringify(payload),
        });
        console.log("Created feasibility submission:", created._id);

        const pdfStream = await generateFeasibilityPdfBytes(data);
        const pdfBuffer = await streamToBuffer(pdfStream);
        console.log("Generated PDF buffer, size:", pdfBuffer.length);
        const pdfAsset = await writeClient.assets.upload("file", pdfBuffer, {
            filename: `Feasibility-Report-${created._id}.pdf`,
            contentType: "application/pdf",
        });

        await writeClient
            .patch(created._id)
            .set({ pdf: { _type: "file", asset: { _type: "reference", _ref: pdfAsset._id } } })
            .commit();

        console.log("Uploaded PDF asset:", pdfAsset.url);

        // Push to Pipedrive
        const person = await createPipedrivePerson({
            name,
            phone: [{ value: phone, primary: true }],
            email: [{ value: email, primary: true }],
        });

        const note = await createPipedriveNote(
            person.id,
            [
                `Feasibility Engine submission`,
                `Address: ${address}, ${city}`,
                `Motivation: ${motivation}`,
                `Type: ${aduType} | ${bed} bed / ${bath} bath`,
                `PDF: ${pdfAsset.url}`,
            ].join("<br/>")
        );
        console.log("Pipedrive Note create response:", note);
        await writeClient.patch(created._id).set({ pipedrive: { personId: person.id, noteId: note.id } }).commit();

        return NextResponse.json({ submissionId: created._id, pdfUrl: pdfAsset.url });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
    }
}
