'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-solid-svg-icons'
import { faSpinnerThird } from '@fortawesome/pro-duotone-svg-icons'

import Link from 'next/link'

import Logo from '@/components/Logo'

import style from './Form.module.css'
import RadioGroup from '@/components/RadioGroup'
import Checkbox from '@/components/Checkbox'

export default function LeadForm() {
    const [showError, setShowError] = useState(false)

    const router = useRouter()

    function goBack() {
        router.back()
    }

    async function createPerson(e) {
        e.preventDefault()
        e.target.fields.disabled = true
        e.target.btn.firstChild.innerText = 'Submitting...'
        e.target.btn.lastChild.style.display = 'block'

        const consentEmail = e.target.consentEmail.checked
        const consentTexts = e.target.consentTextMessages.checked

        // 05/17/25 - To comply with JustCall requirements, I removed '|| !consentTextMessages' to set text messaging to optional
        // 05/20/25 - Remove consentEmail check to allow form submission without email consent
        // if (!consentEmail) {
        //     setShowError(true)
        //     e.target.fields.disabled = false
        //     e.target.btn.firstChild.innerText = 'Submit'
        //     e.target.btn.lastChild.style.display = 'none'
        //     return
        // }

        const person = {
            name: e.target.name.value,
            email: [{ value: e.target.email.value }],
            phone: [{ value: e.target.mobile.value }],
            '733d97610511293c521189a69a776c732bae881c': consentEmail
                ? 'subscribed'
                : 'unsubscribed',
            '3397c6015c59f81b73082a78efb98a6bcc88b258': consentTexts
                ? 'subscribed'
                : 'unsubscribed',
        }

        const names = e.target.name.value.split(' ')

        const lead = {
            name: e.target.name.value,
            address: e.target.address.value,
            firstname: names[0],
            lastname: names[names.length - 1],
            email: [{ value: e.target.email.value }],
            phone: [{ value: e.target.mobile.value }],
            source: e.target.source.value,
        }
        try {
            const res = await fetch('/api/pipedrive/create-person', {
                method: 'POST',
                body: JSON.stringify({ person }),
                headers: { 'Content-Type': 'application/json' },
            })

            const personCreated = await res.json()

            if (personCreated.success) {
                submitLead(personCreated, lead)
            }
        } catch (error) {
            console.log('Error creating person:', error)
        }
    }

    async function submitLead(person, lead) {
        let sourceNumber = 0

        switch (lead.source) {
            case 'ADU Event':
                sourceNumber = 58
                break
            case 'Open House':
                sourceNumber = 59
                break
            case 'Referral':
                sourceNumber = 60
                break
            case 'Search':
                sourceNumber = 61
                break
            case 'Social Media':
                sourceNumber = 28
                break
            default:
                sourceNumber = 56
        }

        const submittedLead = {
            title: `${lead.firstname} ${lead.lastname}`,
            person_id: person.data.data.id,
            // prettier-ignore
            'fd49bc4881f7bdffdeaa1868171df24bea5925fe': sourceNumber,
            '47f338d18c478ccd45a1b19afb8629561a7f714e': lead.address,
            // prettier-ignore
            'c30b635d9bdcdd388eff5bf6f1358f0dc43286a7': lead.emailConsent,
            // prettier-ignore
            'fce207a36d761025490865bae5bd77b19aaf5779': lead.textConsent,
        }
        try {
            const leadRes = await fetch('/api/pipedrive/submit-lead', {
                method: 'POST',
                body: JSON.stringify({ submittedLead }),
                headers: { 'Content-Type': 'application/json' },
            })

            const leadData = await leadRes.json()

            if (leadData.success) {
                router.push(`/talk-to-an-adu-specialist/calendly`)
            }
        } catch (error) {
            console.log('Error submitting lead:', error)
        }
    }

    async function getDealFields(e) {
        e.preventDefault()

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/dealFields?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`
        )
        const data = await res.json()

        console.log('All fields:', data)
    }

    async function getPersonFields(e) {
        e.preventDefault()

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/personFields?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`
        )
        const data = await res.json()

        console.log('All person fields:', data)
    }

    const sources = [
        {
            label: 'ADU Event',
            value: 'ADU Event',
        },
        {
            label: 'Open House',
            value: 'Open House',
        },
        {
            label: 'Referral',
            value: 'Referral',
        },
        {
            label: 'Search',
            value: 'Search',
        },
        {
            label: 'Social Media',
            value: 'Social Media',
        },
    ]

    return (
        <>
            <div className={style.topBar}>
                <Logo />
                <FontAwesomeIcon
                    icon={faXmark}
                    size="xl"
                    className={style.icon}
                    onClick={goBack}
                />
            </div>

            <main className={style.root}>
                <div className={style.content}>
                    <div className={style.centered}>
                        <h1>Talk to an ADU specialist</h1>
                        <form onSubmit={createPerson}>
                            <fieldset id="fields">
                                <div className={style.field}>
                                    <label htmlFor="address">
                                        What is your property address?
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        id="address"
                                        required
                                        className={style.textfield}
                                        data-1p-ignore
                                    />
                                </div>
                                <div className={style.field}>
                                    <label htmlFor="name">Full name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        className={style.textfield}
                                        data-1p-ignore
                                    />
                                </div>
                                <div className={style.field}>
                                    <label htmlFor="email">Email address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        required
                                        className={style.textfield}
                                        data-1p-ignore
                                        autoComplete="off"
                                    />
                                </div>
                                <div className={style.field}>
                                    <label htmlFor="mobile">Mobile phone</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        id="mobile"
                                        required
                                        className={style.textfield}
                                    />
                                </div>
                                <RadioGroup name="source" options={sources} />
                                <Checkbox
                                    name="consentEmail"
                                    label="I consent to receive marketing emails from Backyard Estates."
                                />
                                <Checkbox
                                    name="consentTextMessages"
                                    label="I consent to receive automated text messages from Backyard Estates. Reply STOP to opt out."
                                />
                            </fieldset>
                            <button id="btn" className={style.inputButton}>
                                <span>Submit</span>
                                <FontAwesomeIcon
                                    icon={faSpinnerThird}
                                    size="lg"
                                    spin
                                    className={style.spinner}
                                />
                            </button>
                            <p className={style.legal_print}>
                                By clicking submit, you consent to receive
                                marketing emails and automated text messages
                                from Backyard Estates at the email address and
                                phone number you provided. These messages may be
                                sent using an automatic telephone dialing
                                system. Consent is not a condition of purchase.
                                Message and data rates may apply. Message
                                frequency varies. You can opt out at any time by
                                clicking the unsubscribe link in our emails or
                                replying STOP to our text messages. For more
                                information, please review our{' '}
                                <Link href="/legal/terms-of-use">
                                    Terms of Use
                                </Link>{' '}
                                and{' '}
                                <Link href="/legal/privacy-policy">
                                    Privacy Policy
                                </Link>
                                .
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </>
    )
}
