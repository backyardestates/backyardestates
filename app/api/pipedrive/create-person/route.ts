import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const body = await req.json()

    if (req.method === 'POST') {
        try {
            const res = await fetch(
                `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/persons?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`,
                {
                    method: 'POST',
                    body: JSON.stringify(body.person),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )
            const data = await res.json()
            return NextResponse.json({ success: true, data }, { status: 200 })
        } catch (error) {
            return NextResponse.json({ error }, { status: 500 })
        }
    } else {
        console.log('Not a POST request')
    }
}
