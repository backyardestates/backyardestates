import { NextResponse } from 'next/server'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { to, message } = body

        const data = await client.messages.create({
            body: message,
            from: '+18886801863', // Twilio-verified number
            to: to, // Recipient's number
        })

        return NextResponse.json({ success: true, data })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
