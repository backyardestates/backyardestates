export async function POST(req: Request, res: Response) {
    const body = await req.json()
    // console.log('---> API', body)

    // const leadAddress = body.street
    // const leadCity = body.city
    // const leadPurpose = body.purpose
    // const leadPurposeOther = body.purposeOther
    const leadBedrooms = body.bedrooms
    // const leadBathrooms = body.bathrooms
    // const leadHomeowner = body.homeowner
    // const leadOwnerName = body.ownerName
    // const leadOwnerRelationship = body.ownerRelationship
    // const leadTimeline = body.timeline
    // const leadType = body.type
    const leadContactName = body.contactName
    const leadContactPhone = body.contactPhone
    // const leadUnit = body.unit
    // const leadHomeType = body.homeType

    if (req.method === 'POST') {
        // console.log('---> POST received')
        // create person in Pipedrive
        try {
            const person = {
                name: leadContactName,
                phone: [{ value: leadContactPhone }],
            }

            const res = await fetch(
                `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/persons?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`,
                {
                    method: 'POST',
                    body: JSON.stringify(person),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )
            const data = await res.json()
            if (data.success) {
                // create a deal using the person just created

                const person = data.data

                /*
                const names = leadContactName.split(' ')

                const lead = {
                    name: leadContactName,
                    // address: ,
                    firstname: names[0],
                    lastname: names[names.length - 1],
                    // email: [{ value:  }],
                    phone: [{ value: leadContactPhone }],
                    // source: ,
                }
                */

                const submittedLead = {
                    title: `${person.first_name} ${person.last_name}`,
                    person_id: person.id,
                    channel: 'Web forms',
                    channel_id: "backyardestates",
                    // prettier-ignore
                    // 'fd49bc4881f7bdffdeaa1868171df24bea5925fe': source,
                    // '47f338d18c478ccd45a1b19afb8629561a7f714e': lead.address,
                }
                try {
                    const res = await fetch(
                        `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/deals?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`,
                        {
                            method: 'POST',
                            body: JSON.stringify(submittedLead),
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    )
                    const data = await res.json()
                    console.log(data)
                    return Response.json(data)
                } catch (error) {
                    return Response.json({ error }, { status: 500 })
                }
            }
        } catch (error) {
            return Response.json({ error }, { status: 500 })
        }
    } else {
        console.log('Not a POST request')
    }
}
