import { useRef, useState } from 'react'
import Link from 'next/link'
// import Script from 'next/script'
import Layout from '../../src/layouts/LeadForm'
import style from './Form.module.css'

import { redirect } from 'next/navigation'
import { useRouter } from 'next/router'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird } from '@fortawesome/pro-duotone-svg-icons'

import AddressAutocomplete from '@/components/AddressAutocomplete'
import OpenGraph from '@/components/OpenGraph'

import { InlineWidget } from 'react-calendly'

export default function LeadForm({ data }) {
    const router = useRouter()
    const [calendly, setCalendly] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    })

    let selectedAddress = 'Not set yet'

    function getAddress(address) {
        selectedAddress = address
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
        }

        const lead = {
            name: e.target.name.value,
            address: selectedAddress,
            firstname: names[0],
            lastname: names[names.length - 1],
            email: [{ value: e.target.email.value }],
            phone: [{ value: e.target.mobile.value }],
            source: e.target.source.value,
            attributer_channel: e.target.attributer_channel.defaultValue,
            attributer_channeldrilldown1:
                e.target.attributer_channeldrilldown1.defaultValue,
            attributer_channeldrilldown2:
                e.target.attributer_channeldrilldown2.defaultValue,
            attributer_channeldrilldown3:
                e.target.attributer_channeldrilldown3.defaultValue,
            attributer_channeldrilldown4:
                e.target.attributer_channeldrilldown4.defaultValue,
            attributer_landingpage:
                e.target.attributer_landingpage.defaultValue,
            attributer_landingpagegroup:
                e.target.attributer_landingpagegroup.defaultValue,
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
        let source = null

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
            '2d53fd586f7bec45cffbae211118af378a38a61d': d.first_name,
            '30a2b54f80758dab86a35c127fb7fd2d70ba36c0': d.last_name,
            '80ecccdf8f5ceabad89d411094abbc61248f16c8': d.phone[0].value,
            // prettier-ignore
            'fd49bc4881f7bdffdeaa1868171df24bea5925fe': source,
            '47f338d18c478ccd45a1b19afb8629561a7f714e': lead.address,
            // prettier-ignore
            'bbb72730be7b5833fef926f0ab0636961bdb0050': d.primary_email,
            // prettier-ignore
            'dea15c0245a280c47d904902a4f0c0bec33ef082': lead.attributer_channel,
            // prettier-ignore
            'd2397a2fd81f101ff2d74d414bf2d86f4e2e3e2d': lead.attributer_channeldrilldown1,
            '348a2707675ba07647b664ee7b7cee37f612e937':
                lead.attributer_channeldrilldown1,
            '2e2017125cfb22061969c326aa62b8ca2833cf87':
                lead.attributer_channeldrilldown1,
            '5ebaf0bffb3c97b14e83907671781caf4f0e00b0':
                lead.attributer_channeldrilldown1,
            '096a07c957328fdaf6d359d7dc9c9070c9332e70':
                lead.attributer_landingpage,
            '73f6368b2ec18c4cc7e006da670088253fdc88c3':
                lead.attributer_landingpagegroup,
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
            router.push({
                pathname: '/talk-to-an-adu-specialist/calendly',
                query: {
                    name: `${d.first_name} ${d.last_name}`,
                    address: lead.address,
                },
            })
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

    return (
        <Layout>
            <OpenGraph title={`Backyard Estates - Contact form`} />
            <div className={style.content}>
                <div className={style.centered}>
                    <h1>Talk to an ADU specialist</h1>
                    <form onSubmit={createPerson}>
                        <fieldset id="fields">
                            <AddressAutocomplete getAddress={getAddress} />
                            <input
                                type="hidden"
                                id="attributer_channel"
                                name="attributer_channel"
                                value="[channel]"
                            />
                            <input
                                type="hidden"
                                id="attributer_channeldrilldown1"
                                name="attributer_channeldrilldown1"
                                value="[channeldrilldown1]"
                            />
                            <input
                                type="hidden"
                                id="attributer_channeldrilldown2"
                                name="attributer_channeldrilldown2"
                                value="[channeldrilldown2]"
                            />
                            <input
                                type="hidden"
                                id="attributer_channeldrilldown3"
                                name="attributer_channeldrilldown3"
                                value="[channeldrilldown3]"
                            />
                            <input
                                type="hidden"
                                id="attributer_channeldrilldown4"
                                name="attributer_channeldrilldown4"
                                value="[channeldrilldown4]"
                            />
                            <input
                                type="hidden"
                                id="attributer_landingpage"
                                name="attributer_landingpage"
                                value="[landingpage]"
                            />
                            <input
                                type="hidden"
                                id="attributer_landingpagegroup"
                                name="attributer_landingpagegroup"
                                value="[landingpagegroup]"
                            />
                            <div className={style.field}>
                                <label htmlFor="firstname">Full name</label>
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
                            <div className={style.field}>
                                <label>How did you hear about us?</label>
                                <label className={style.option}>
                                    <input
                                        type="radio"
                                        name="source"
                                        value="ADU Event"
                                        required
                                    />
                                    <span className={style.option_label}>
                                        ADU event
                                    </span>
                                </label>
                                <label className={style.option}>
                                    <input
                                        type="radio"
                                        name="source"
                                        value="Open House"
                                    />
                                    <span className={style.option_label}>
                                        Open house
                                    </span>
                                </label>
                                <label className={style.option}>
                                    <input
                                        type="radio"
                                        name="source"
                                        value="Referral (Friend/Real Estate Agent/Lender etc.)"
                                    />
                                    <span className={style.option_label}>
                                        Referral (Friend/Real Estate
                                        Agent/Lender etc.)
                                    </span>
                                </label>
                                <label className={style.option}>
                                    <input
                                        type="radio"
                                        name="source"
                                        value="Search"
                                    />
                                    <span className={style.option_label}>
                                        Search
                                    </span>
                                </label>
                                <label className={style.option}>
                                    <input
                                        type="radio"
                                        name="source"
                                        value="Social Media"
                                    />
                                    <span className={style.option_label}>
                                        Social media
                                    </span>
                                </label>
                            </div>
                        </fieldset>
                        <button id="btn" className={style.inputButton}>
                            <span>Submit</span>
                            <FontAwesomeIcon
                                icon={faSpinnerThird}
                                size="lg"
                                spin
                                style={{
                                    '--fa-primary-color': '#fff',
                                    '--fa-secondary-color': '#fff',
                                    '--fa-secondary-opacity': '0.25',
                                }}
                                className={style.icon}
                            />
                        </button>
                        <p className={style.legal_print}>
                            By clicking &ldquo;Submit,&rdquo; you are granting
                            consent to receive promotional emails and text
                            messages from Backyard Estates. These communications
                            aim to keep you informed about updates, special
                            offers, and pertinent information regarding our ADU
                            construction services. Additionally, your consent
                            indicates that you have read and understood our{' '}
                            <Link href="/legal/privacy-policy">
                                Privacy Policy
                            </Link>
                            . You may choose to unsubscribe from our promotional
                            emails and texts by using the opt-out link provided
                            in our communications. Thank you for considering
                            Backyard Estates for your ADU needs.
                        </p>
                    </form>
                </div>
            </div>
        </Layout>
    )
}
