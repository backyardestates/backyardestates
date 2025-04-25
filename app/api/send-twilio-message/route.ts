import { NextResponse } from 'next/server'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

const client = require('twilio')(accountSid, authToken)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { to, message } = body
        const minutes: number = 15 // Schedule for 15 minutes later
        const sendWhen = new Date(new Date().getTime() + minutes * 60000)

        const data = await client.messages.create({
            body: message,
            messagingServiceSid: 'MG3658dc8e8a85d8b20208e74739fb1ecf',
            from: '+18886801863',
            to: to,
            scheduleType: 'fixed',
            sendAt: sendWhen.toISOString(),
        })

        return NextResponse.json({ success: true, data })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
