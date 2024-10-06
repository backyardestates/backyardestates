'use client'

import style from './Newsletter.module.css'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird } from '@fortawesome/pro-duotone-svg-icons'

export default function Newsletter() {
    return (
        <div className={style.base}>
            <p className={style.paragraph}>
                Stay informed and up-to-date on all of our latest news and
                promotions.
            </p>
            <form onSubmit={createPerson}>
                <div className={style.container}>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        placeholder="Enter your email address"
                        className={style.inputEmail}
                        data-1p-ignore
                        autoComplete="off"
                    />
                    <button id="btn" className={style.inputButton}>
                        <span>Subscribe</span>
                        {/* <FontAwesomeIcon
                            icon={faSpinnerThird}
                            size="lg"
                            spin
                            style={{
                                '--fa-primary-color': '#36484b',
                                '--fa-secondary-color': '#36484b',
                                '--fa-secondary-opacity': '0.25',
                            }}
                            className={style.icon}
                        /> */}
                    </button>
                </div>
                <div id="success" className={style.success}>
                    Thank you for joining our newsletter
                </div>
            </form>
        </div>
    )
}

export async function createPerson(e) {
    e.preventDefault()

    e.target.email.disabled = true
    e.target.btn.disabled = true
    e.target.btn.firstChild.innerText = 'Submitting...'
    e.target.btn.lastChild.style.display = 'block'

    const lead = {
        name: 'Email subscription',
        email: [{ value: e.target.email.value }],
    }

    const res = await fetch(
        `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/persons?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`,
        {
            method: 'POST',
            body: JSON.stringify(lead),
            headers: {
                'Content-Type': 'application/json',
            },
        }
    )
    const data = await res.json()

    if (data.success) {
        e.target.firstChild.style.display = 'none'
        e.target.lastChild.style.display = 'inline-flex'
    }
}
