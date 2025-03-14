import { EmailTemplate } from '@/components/EmailTemplate'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    const body = await req.json()
    const from = body.emailFrom
    const name = body.name
    const email = body.emailTo
    const message = body.message
    const collection = body.collection

    try {
        const { data, error } = await resend.emails.send({
            from: `${name} <${email}>`,
            to: [email],
            subject: `${name} shared an ADU by Backyard Estates`,
            // @ts-ignore
            react: EmailTemplate({
                from: from,
                name: name,
                email: email,
                message: message,
                collection: collection,
            }),
        })

        if (error) {
            return new Response(JSON.stringify({ error }), { status: 500 })
        }
        return new Response(JSON.stringify(data))
    } catch (error) {
        return new Response(JSON.stringify({ error }), { status: 500 })
    }
}
