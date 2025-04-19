'use client'

export default function Twilio() {
    const sendMessage = async () => {
        const response = await fetch('/api/send-twilio-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // to: '+18777804236',
                to: '+18018503070',
                message: 'Test message from Backyard Estates.',
            }),
        })

        const data = await response.json()
        console.log('Twilio', data)
    }

    return (
        <>
            <main style={{ padding: '1rem' }}>
                <p>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault() // Prevent default link behavior
                            sendMessage() // Call the function
                        }}
                    >
                        Send Twilio message
                    </a>
                </p>
            </main>
        </>
    )
}
