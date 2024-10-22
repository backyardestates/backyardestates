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

    if (req.method === 'POST') {
        try {
            const { data, error } = await resend.emails.send({
                from: `${name} <${email}>`,
                to: [email],
                subject: `${name} shared an ADU by Backyard Estates`,
                react: EmailTemplate({
                    from: from,
                    name: name,
                    email: email,
                    message: message,
                    collection: collection,
                }),
            })

            if (error) {
                return Response.json({ error }, { status: 500 })
            }
            return Response.json(data)
        } catch (error) {
            return Response.json({ error }, { status: 500 })
        } finally {
            console.log('email sent')
        }
    } else {
        console.log('Not allowed')
    }
}
