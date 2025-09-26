const PIPELINE_ID = "7"; // your pipeline ID
const ATTENDED_STAGE_ID = 78; // your "Attended" stage ID
const API_TOKEN = process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN;
const DOMAIN = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN;

if (!API_TOKEN) throw new Error("Pipedrive token not set");
if (!DOMAIN) throw new Error("Pipedrive domain not set");

export async function markDealAttended(personId: string) {
    // 1️⃣ Get person details
    const personRes = await fetch(
        `https://${DOMAIN}.pipedrive.com/v1/persons/${personId}?api_token=${API_TOKEN}`
    );
    const personData = await personRes.json();
    if (!personData.success) {
        throw new Error(
            "Failed to fetch person from Pipedrive: " + JSON.stringify(personData)
        );
    }

    const getDealsFromPerson = await fetch(
        `https://${DOMAIN}.pipedrive.com/v1/persons/${personId}/deals?api_token=${API_TOKEN}`
    );
    const dealsFromPerson = await getDealsFromPerson.json();
    console.log(dealsFromPerson)

    // 2️⃣ Find the deal in the target pipeline (optional: take first deal)
    const dealId = dealsFromPerson.data[0].id;

    console.log(dealId)

    // 3️⃣ Update deal stage
    const dealRes = await fetch(
        `https://${DOMAIN}.pipedrive.com/v1/deals/${dealId}?api_token=${API_TOKEN}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stage_id: ATTENDED_STAGE_ID,
            }),
        }
    );

    const dealData = await dealRes.json();

    console.log(dealData)
    if (!dealData.success) {
        throw new Error(
            "Failed to update deal in Pipedrive: " + JSON.stringify(dealData)
        );
    }

    return dealData;
}
