// import { useState } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import usePlacesAutocomplete from 'use-places-autocomplete'
import {
    Combobox,
    ComboboxInput,
    ComboboxPopover,
    ComboboxList,
    ComboboxOption,
} from '@reach/combobox'
import '@reach/combobox/styles.css'

import style from './AddressAutocomplete.module.css'

const libraries = ['places']

export default function AddressAutocomplete({ setAddress }) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: libraries,
    })

    if (!isLoaded) return <div>Loading...</div>
    return (
        <div className={style.base}>
            <label>What is your property address?</label>
            <PlacesAutocomplete setAddress={setAddress} />
        </div>
    )
}

const PlacesAutocomplete = ({ setAddress }) => {
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete()

    console.log(ready)

    const handleSelect = async (address) => {
        setValue(address, false)
        clearSuggestions()
        // console.log(address)
        setAddress(address)
    }

    return (
        <Combobox onSelect={handleSelect}>
            <ComboboxInput
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!ready}
                className={style.textfield}
                // placeholder="Enter address"
                data-1p-ignore
            />
            <ComboboxPopover className={style.list}>
                <ComboboxList>
                    {status === 'OK' &&
                        data.map(({ place_id, description }) => (
                            <ComboboxOption
                                key={place_id}
                                value={description}
                                className={style.item}
                            />
                        ))}
                </ComboboxList>
            </ComboboxPopover>
        </Combobox>
    )
}
