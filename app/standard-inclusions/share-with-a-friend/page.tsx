'use client'

import { useState } from 'react'
import Link from 'next/link'
// import Layout from '../../../src/layouts/LeadForm'
import style from './Form.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird } from '@fortawesome/pro-duotone-svg-icons'
// import OpenGraph from '@/components/OpenGraph'

export default function LeadForm() {
    const [formData, setFormData] = useState({
        emailTo: '',
        name: '',
        emailFrom: '',
        message: '',
    })
    const [showForm, setShowForm] = useState(true)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        e.target.fields.disabled = true
        e.target.btn.firstChild.innerText = 'Submitting...'
        e.target.btn.lastChild.style.display = 'block'

        const res = await fetch('/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })

        const result = await res.json()

        if (result.sent) {
            setShowForm(false)
        }
    }

    return (
        <>
            <div className={style.content}>
                <div className={style.centered}>
                    <h1>Share with a friend</h1>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                    </p>
                    {showForm && (
                        <form onSubmit={handleSubmit}>
                            <fieldset id="fields">
                                <div>
                                    <h2 className={style.section}>To:</h2>
                                    <div className={style.field}>
                                        <label htmlFor="emailTo">
                                            Email address
                                        </label>
                                        <input
                                            type="email"
                                            name="emailTo"
                                            id="emailTo"
                                            required
                                            className={style.textfield}
                                            data-1p-ignore
                                            autoComplete="off"
                                            value={formData.emailTo}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h2 className={style.section}>From:</h2>
                                    <div className={style.field}>
                                        <label htmlFor="name">Full name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            required
                                            className={style.textfield}
                                            data-1p-ignore
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={style.field}>
                                        <label htmlFor="emailFrom">
                                            Email address
                                        </label>
                                        <input
                                            type="email"
                                            name="emailFrom"
                                            id="emailFrom"
                                            required
                                            className={style.textfield}
                                            data-1p-ignore
                                            autoComplete="off"
                                            value={formData.emailFrom}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={style.field}>
                                        <label htmlFor="message">Message</label>
                                        <textarea
                                            name="message"
                                            id="message"
                                            required
                                            className={style.textarea}
                                            data-1p-ignore
                                            autoComplete="off"
                                            rows={5}
                                            value={formData.message}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <button id="btn" className={style.inputButton}>
                                <span>Submit</span>
                                <FontAwesomeIcon
                                    icon={faSpinnerThird}
                                    size="lg"
                                    spin
                                    className={style.icon}
                                />
                            </button>
                            <p className={style.legal_print}>
                                By clicking &ldquo;Submit,&rdquo; you are
                                granting consent to receive promotional emails
                                and text messages from Backyard Estates. These
                                communications aim to keep you informed about
                                updates, special offers, and pertinent
                                information regarding our ADU construction
                                services. Additionally, your consent indicates
                                that you have read and understood our{' '}
                                <Link href="/legal/privacy-policy">
                                    Privacy Policy
                                </Link>
                                . You may choose to unsubscribe from our
                                promotional emails and texts by using the
                                opt-out link provided in our communications.
                                Thank you for considering Backyard Estates for
                                your ADU needs.
                            </p>
                        </form>
                    )}
                    {!showForm && (
                        <div className={style.success}>
                            Your email has been sent.
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
