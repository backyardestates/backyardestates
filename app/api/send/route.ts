export async function POST(req: Request, res: Response) {
    const body = await req.json()

    const leadNotes = body.specificHelp
    const leadPurpose = body.purpose
    const leadPurposeOther = body.purposeOther
    const leadBedrooms = body.bedrooms
    const leadBathrooms = body.bathrooms
    const leadHomeowner = body.homeowner
    const leadOwnerName = body.ownerName
    const leadOwnerRelationship = body.ownerRelationship
    const leadTimeline = body.timeline
    const leadType = body.type
    const leadContactName = body.contactName
    const leadContactPhone = body.contactPhone
    const leadContactEmail = body.contactEmail
    const leadUnit = body.unit
    const leadHomeType = body.homeType
    const leadAddress = body.propertyAddress
    const leadReferrerName = body.referrerName
    const leadReferrerPhone = body.referrerPhone
    const leadReferrerEmail = body.referrerEmail

    if (req.method === 'POST') {
        // console.log('---> POST received')
        // create person in Pipedrive
        try {
            const person = {
                name: leadContactName,
                phone: [{ value: leadContactPhone }],
                email: [{ value: leadContactEmail }],
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

                const names = leadContactName.split(' ')

                const lead = {
                    name: leadContactName,
                    // address: ,
                    firstname: names[0],
                    lastname: names[names.length - 1],
                    // email: [{ value:  }],
                    phone: [{ value: leadContactPhone }],
                }

                const submittedLead = {
                    title: `${person.first_name} ${person.last_name}`,
                    person_id: person.id,
                    channel: 'Web forms',
                    channel_id: 'backyardestates',
                    // prettier-ignore
                    // 'fd49bc4881f7bdffdeaa1868171df24bea5925fe': source,
                    '47f338d18c478ccd45a1b19afb8629561a7f714e': leadAddress,
                    // Purpose or ProposeOther
                    '28d071c301c50da1fe60ad97ae76f395beeb97e4':
                        leadPurpose !== 'Other'
                            ? leadPurpose
                            : leadPurposeOther,
                    // Property type
                    '8b7d0ed26fa9070a3dfca98ccce7d7cdd5b485f2': leadHomeType,
                    // ADU Type
                    // prettier-ignore
                    'ea514ff4e9a7ff51f659e1ae0f2ed98c2f09b081': leadType,
                    // ADU Unit
                    '4b02327089f88d403b26d48e81dfd2019fb260ba': leadUnit,
                    // Bedroom Count
                    '25f2a264d98c26cb30095ee4da6b885e835f3376': leadBedrooms,
                    // Bathroom Count
                    '948f4e1492685ef2e511b27a03e47c2ffbc63d64': leadBathrooms,
                    // Timeline
                    '53c5806fd2917aff627bfaf47582aeb1e97bdf6f': leadTimeline,
                    // Homeowner
                    '5224119a2462ae06d71b69037d6b2d9c11783d89': leadHomeowner,
                    // Property Owner Name
                    // prettier-ignore
                    'ab52a8f9611b84f0b83c2cd291fccde0aa964ea2': leadOwnerName,
                    // Property Owner Number
                    '092beb6c2615344096657b196a4b42961384a9bd':
                        leadOwnerRelationship,
                    // "Notes"
                    '015bdaea2150906c2ff3bf0040107c1ccb8de987': leadNotes,
                    // Referrer Name
                    // prettier-ignore
                    'aae592c3781d03f0992d212383b32ce64f4487a2': leadReferrerName,
                    // Referrer Phone
                    // prettier-ignore
                    'f532df77d90a97f82ab999fa71779fcd38bf0701': leadReferrerPhone,
                    // Referrer Email
                    '93a260624baba4c7a3785fbb30f8fb97400a6f96':
                        leadReferrerEmail,
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
