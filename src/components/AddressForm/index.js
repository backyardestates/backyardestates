// AddressValidationForm.js
import React, { useState } from 'react'
import { Client } from '@googlemaps/google-maps-services-js'

const AddressValidationForm = () => {
    // const [address, setAddress] = useState('')
    // const [validationMessage, setValidationMessage] = useState('')

    // ;('AIzaSyAD3TF6-wY8SaFf_rjZf8rsWHb11MhlYq0')

    const client = new Client({})

    client
        .elevation({
            params: {
                locations: [{ lat: 45, lng: -110 }],
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
            timeout: 1000, // milliseconds
        })
        .then((r) => {
            console.log(r.data.results[0].elevation)
        })
        .catch((e) => {
            // console.log(e.response.data.error_message)
        })

    return <div>Form</div>
}

export default AddressValidationForm
