export const runtime = "nodejs"

import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/writeClient";
import { client } from "@/sanity/client";
import { generateFeasibilityPdfBytes } from "@/lib/feasibility/generatePdf";

const FLOORPLAN_BY_ID = `
*[_type=="floorplan" && _id==$id][0]{
  _id, name, bed, bath, sqft, price
}
`;

async function createPipedrivePerson(person: any) {
    const domain = process.env.PIPEDRIVE_DOMAIN;
    const token = process.env.PIPEDRIVE_API_TOKEN;

    const res = await fetch(`https://${domain}.pipedrive.com/v1/persons?api_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(person),

    });

    const json = await res.json();
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
    if (!res.ok) throw new Error(json?.error || "Pipedrive note create failed");
    return json?.data;
}

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Minimal required fields (your list)
        const name = payload?.name?.trim();
        const phone = payload?.phone?.trim();
        const email = payload?.email?.trim();
        const address = payload?.address?.trim();
        const city = payload?.city?.trim();
        const aduType = payload?.aduType;
        const bed = payload?.bed;
        const bath = payload?.bath;
        const intendedUse = payload?.intendedUse;

        if (!name || !phone || !email || !address || !city || !aduType || bed == null || bath == null || !intendedUse) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch floorplan for nicer PDF + record
        let floorplan = null;
        if (payload?.selectedFloorplanId) {
            floorplan = await client.fetch(FLOORPLAN_BY_ID, { id: payload.selectedFloorplanId });
        }

        // Build canonical data object
        const data = {
            contact: { name, phone, email },
            address: { full: address, city },
            aduType,
            bed,
            bath,
            intendedUse,
            selectedFloorplanId: payload?.selectedFloorplanId || null,
            floorplan,
            riskFlags: payload?.riskFlags ?? [],
            outputs: payload?.outputs ?? {},
        };

        // Create Sanity doc first (without pdf)
        const created = await writeClient.create({
            _type: "feasibilitySubmission",
            createdAt: new Date().toISOString(),
            status: "new",
            contact: data.contact,
            address: data.address,
            aduType: data.aduType,
            bed: data.bed,
            bath: data.bath,
            intendedUse: data.intendedUse,
            selectedFloorplan: data.selectedFloorplanId
                ? { _type: "reference", _ref: data.selectedFloorplanId }
                : undefined,
            outputs: data.outputs,
            riskFlags: data.riskFlags,
            rawState: JSON.stringify(payload),
        });

        // Generate PDF bytes
        const pdfBytes = await generateFeasibilityPdfBytes(data);

        // Upload PDF to Sanity asset store
        const pdfAsset = await writeClient.assets.upload(
            "file",
            pdfBytes,
            { filename: `ADU-Feasibility-${created._id}.pdf`, contentType: "application/pdf" }
        );

        // Patch doc with pdf
        await writeClient.patch(created._id).set({
            pdf: { _type: "file", asset: { _type: "reference", _ref: pdfAsset._id } },
        }).commit();

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
                `Type: ${aduType} | ${bed} bed / ${bath} bath | Use: ${intendedUse}`,
                `PDF: ${pdfAsset.url}`,
            ].join("<br/>")
        );

        await writeClient.patch(created._id).set({
            pipedrive: { personId: person.id, noteId: note.id },
        }).commit();

        return NextResponse.json({
            submissionId: created._id,
            pdfUrl: pdfAsset.url,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
    }
}
