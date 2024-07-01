// import { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
    if (req.method === 'POST') {
        // Process a POST request
        const { emailTo, name, emailFrom, message } = req.body

        // Send a response back to the client
        res.status(200).json({
            sent: true,
            // data: { emailTo, emailFrom },
        })

        const { data, error } = await resend.emails.send({
            from: `${name} <${emailFrom}>`,
            to: [emailTo],
            subject: `Check out Backyard Estates' standard inclusions`,
            html: `<strong>${message}</strong>`,
        })

        if (error) {
            return res.status(400).json(error)
        }

        res.status(200).json(data)
    } else {
        // Handle any other HTTP method
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
