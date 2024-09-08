'use client'
import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-solid-svg-icons'
import { faSpinnerThird } from '@fortawesome/pro-duotone-svg-icons'

import Link from 'next/link'

import Logo from '@/components/Logo'
import OpenGraph from '@/components/OpenGraph'

import style from './Form.module.css'
import MultiStepForm from '@/components/MultiStepForm'

export default function LeadForm({ path }) {
    const router = useRouter()

    function goBack() {
        router.back()
    }
    /*
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
        }

        const lead = {
            name: e.target.name.value,
            address: e.target.address.value,
            firstname: names[0],
            lastname: names[names.length - 1],
            email: [{ value: e.target.email.value }],
            phone: [{ value: e.target.mobile.value }],
            source: e.target.source.value,
        }

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/persons?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`,
            {
                method: 'POST',
                body: JSON.stringify(person),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        const data = await res.json()

        createLead(data.data, lead)
    }

    async function createLead(d, lead) {
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
            title: `${d.first_name} ${d.last_name}`,
            person_id: d.id,
            // prettier-ignore
            'fd49bc4881f7bdffdeaa1868171df24bea5925fe': source,
            '47f338d18c478ccd45a1b19afb8629561a7f714e': lead.address,
        }

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/deals?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`,
            {
                method: 'POST',
                body: JSON.stringify(submittedLead),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        const data = await res.json()

        if (data.success) {
            router.push(
                `/talk-to-an-adu-specialist/calendly?name=${d.first_name} ${d.last_name}&address=${lead.address}&email=${d.primary_email}`
            )
        }
    }

    async function getAllFields(e) {
        e.preventDefault()

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/dealFields?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`
        )
        const data = await res.json()

        if (!data) {
            console.log('Problem')
        } else {
            console.log(data)
        }
    }
*/
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
                <OpenGraph title={`Backyard Estates - Submit a referral`} />
                <div className={style.content}>
                    <div className={style.centered}>
                        <h1>Submit a referral</h1>
                        <MultiStepForm />
                    </div>
                </div>
            </main>
        </>
    )
}
