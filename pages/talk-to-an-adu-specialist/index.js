import AddressValidationForm from '@/components/AddressForm'
import Layout from '../../src/layouts/Page'
import style from './Form.module.css'

export async function createPerson(e) {
    e.preventDefault()

    const lead = {
        name: `${e.target.firstname.value} ${e.target.lastname.value}`,
        email: [{ value: e.target.email.value }],
        phone: [{ value: e.target.mobile.value }],
    }

    const address = e.target.address.value

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
    // console.log(data)
    SubmitLead(data.data, address)
}

export async function SubmitLead(d, a) {
    const lead = {
        title: 'Ray Elder',
        person_id: d.id,
        '2d53fd586f7bec45cffbae211118af378a38a61d': d.first_name,
        '30a2b54f80758dab86a35c127fb7fd2d70ba36c0': d.last_name,
        '80ecccdf8f5ceabad89d411094abbc61248f16c8': d.phone[0].value,
        '47f338d18c478ccd45a1b19afb8629561a7f714e': a,
        // prettier-ignore
        'bbb72730be7b5833fef926f0ab0636961bdb0050': d.primary_email,
    }

    const res = await fetch(
        `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/leads?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`,
        {
            method: 'POST',
            body: JSON.stringify(lead),
            headers: {
                'Content-Type': 'application/json',
            },
        }
    )
    const data = await res.json()
}

// AIzaSyAD3TF6-wY8SaFf_rjZf8rsWHb11MhlYq0

export default function LeadForm({ data }) {
    // getCustomFields()
    return (
        <Layout
            title="Talk to an ADU specialist"
            explanation="Aliquet risus feugiat in ante metus dictum at tempor commodo ullamcorper a lacus vestibulum sed arcu non odio euismod lacinia at quis risus sed vulputate odio."
        >
            <div className={style.content} onSubmit={createPerson}>
                <form>
                    <div>
                        <label htmlFor="address">Address</label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            required
                            defaultValue="32532 Campo Dr"
                        />
                    </div>
                    <div>
                        <label htmlFor="firstname">First name</label>
                        <input
                            type="text"
                            name="firstname"
                            id="firstname"
                            required
                            defaultValue="Ray"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastname">Last name</label>
                        <input
                            type="text"
                            name="lastname"
                            id="lastname"
                            required
                            defaultValue="Elder"
                        />
                    </div>
                    <div>
                        <label htmlFor="email">Enter your email </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            defaultValue="hello@rayelder.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="mobile">Mobile phone</label>
                        <input
                            type="text"
                            name="mobile"
                            id="mobile"
                            required
                            defaultValue="8018503070"
                        />
                    </div>
                    <div>
                        <input type="submit" value="Submit" />
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export async function getCustomFields() {
    // console.log(lead)

    const res = await fetch(
        `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/dealFields:(key,name)?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`
    )
    const data = await res.json()
    console.log(data)
}
