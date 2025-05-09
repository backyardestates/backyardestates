'use client'

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
    const router = useRouter()

    function goBack() {
        router.back()
    }

    async function createPerson(e) {
        e.preventDefault()
        e.target.fields.disabled = true
        e.target.btn.firstChild.innerText = 'Submitting...'
        e.target.btn.lastChild.style.display = 'block'

        const names = e.target.name.value.split(' ')
        const person = {
            name: e.target.name.value,
            email: [{ value: e.target.email.value }],
            phone: [{ value: e.target.mobile.value }],
            marketing_status: 'subscribed',
        }
        try {
            const res = await fetch('/api/pipedrive/create-person', {
                method: 'POST',
                body: JSON.stringify({ person }),
                headers: { 'Content-Type': 'application/json' },
            })

            const createdPerson = await res.json()

            if (createdPerson.success) {
                console.log('Person created:', createdPerson.data)
                const lead = {
                    person_id: createdPerson.data.id,
                    name: e.target.name.value,
                    address: e.target.address.value,
                    firstname: names[0],
                    lastname: names[names.length - 1],
                    email: [{ value: e.target.email.value }],
                    phone: [{ value: e.target.mobile.value }],
                    source: e.target.source.value,
                }

                console.log('Lead:', lead)

                let source = 0

                switch (lead.source) {
                    case 'ADU Event':
                        source = 58
                        break
                    case 'Open House':
                        source = 59
                        break
                    case 'Referral':
                        source = 60
                        break
                    case 'Search':
                        source = 61
                        break
                    case 'Social Media':
                        source = 28
                        break
                    default:
                        source = 56
                }

                const submittedLead = {
                    title: `${lead.firstname} ${lead.lastname}`,
                    person_id: lead.person_id,
                    // prettier-ignore
                    'fd49bc4881f7bdffdeaa1868171df24bea5925fe': source,
                    '47f338d18c478ccd45a1b19afb8629561a7f714e': lead.address,
                }
                try {
                    const leadRes = await fetch('/api/pipedrive/submit-lead', {
                        method: 'POST',
                        body: JSON.stringify({ submittedLead }),
                        headers: { 'Content-Type': 'application/json' },
                    })

                    const leadData = await leadRes.json()

                    if (leadData.success) {
                        // router.push(`/talk-to-an-adu-specialist/calendly`)
                    }
                } catch (error) {
                    console.log('Error submitting lead:', error)
                }
            }
        } catch (error) {
            console.log('Error creating person:', error)
        }
    }

    /*
    async function getAllFields(e) {
        e.preventDefault()

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/dealFields?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`
        )
        const data = await res.json()
    }
    */

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
                            {/* <form onSubmit={checkCheck}> */}
                            {/* <form onSubmit={getAllFields}> */}
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
                                    label="I consent to receive promotional emails and
                                    text messages from Backyard Estates."
                                    explanation={
                                        <>
                                            Your consent indicates that you have
                                            read and understood our{' '}
                                            <Link href="/legal/privacy-policy">
                                                Privacy Policy
                                            </Link>
                                            . You may unsubscribe at any time by
                                            using the opt-out links provided.
                                        </>
                                    }
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
                        </form>
                    </div>
                </div>
            </main>
        </>
    )
}
