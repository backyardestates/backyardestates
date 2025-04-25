'use client'

export default function Twilio() {
    const sendMessage = async () => {
        const phoneNumbers = ['+18018503070', '+13854994168']

        for (const to of phoneNumbers) {
            try {
                const response = await fetch('/api/send-twilio-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: to,
                        message:
                            'Backyard Estates: Single message to multiple recipients',
                    }),
                })

                const data = await response.json()
                console.log(`Message sent to ${to}:`, data)
            } catch (error) {
                console.error(`Failed to send message to ${to}:`, error)
            }
        }
    }

    return (
        <>
            <main style={{ padding: '1rem' }}>
                <p>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault()
                            sendMessage()
                        }}
                    >
                        Send Twilio message
                    </a>
                </p>
            </main>
        </>
    )
}
