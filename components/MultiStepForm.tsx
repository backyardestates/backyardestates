'use client'

import { useState } from 'react'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { leadSchema } from '@/lib/schema'

import Step1 from './Step1'
import Step3 from './Step3'
import Step4 from './Step4'
import Step6 from './Step6'
import Step7 from './Step7'
import Step9 from './Step9'
import Step10 from './Step10'

export default function MultiStepForm() {
    const [step, setStep] = useState(1)

    interface LeadPreferences {
        purpose: string
        bedrooms: number
        bathrooms: number
        homeowner: string
        timeline: string
        unitType: string
        unit: string
        homeType: string
    }

    const initialPrefs = {
        purpose: '',
        bedrooms: 0,
        bathrooms: 0,
        homeowner: '',
        timeline: '',
        unitType: '',
        unit: '',
        homeType: '',
    }

    const [preferences, setPreferences] =
        useState<LeadPreferences>(initialPrefs)

    type FormValues = z.infer<typeof leadSchema>

    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors },
    } = useForm<FormValues>()

    const onSubmit = async (data: FormValues) => {
        data.purpose = preferences.purpose
        data.bedrooms = preferences.bedrooms
        data.bathrooms = preferences.bathrooms
        data.homeowner = preferences.homeowner
        data.timeline = preferences.timeline
        data.type = preferences.unitType
        data.unit = preferences.unit
        data.homeType = preferences.homeType

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                setStep(12)
            } else {
                const data = await response.json()
            }
        } catch (err) {
            console.log('Failed to submit', err)
        }
    }

    const next = (nextStep: number) => {
        if (step === 11) {
            handleSubmit(onSubmit)
        } else {
            setStep(nextStep)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
                <Step1
                    setStep={setStep}
                    preferences={preferences}
                    setPreferences={setPreferences}
                />
            )}

            {step === 2 && (
                <>
                    <h2 className="multistep">Tell us more</h2>

                    <div>
                        <div>
                            <textarea
                                id="purposeOther"
                                {...register('purposeOther', {
                                    required:
                                        'Please describe why you need an ADU',
                                })}
                                className="multistep"
                                rows={5}
                            />
                            {errors.purposeOther && (
                                <p className="multistep error">
                                    {errors.purposeOther.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            const output = await trigger('purposeOther', {
                                shouldFocus: true,
                            })
                            if (output) {
                                next(3)
                            }
                        }}
                        className="multistep button"
                    >
                        Contine
                    </button>
                </>
            )}
            {step === 3 && (
                <Step3
                    setStep={setStep}
                    preferences={preferences}
                    setPreferences={setPreferences}
                />
            )}
            {step === 4 && (
                <Step4
                    setStep={setStep}
                    preferences={preferences}
                    setPreferences={setPreferences}
                />
            )}
            {step === 6 && (
                <Step6
                    setStep={setStep}
                    preferences={preferences}
                    setPreferences={setPreferences}
                />
            )}
            {step === 7 && (
                <Step7
                    setStep={setStep}
                    preferences={preferences}
                    setPreferences={setPreferences}
                />
            )}

            {step === 8 && (
                <>
                    <h2 className="multistep">Who is the property owner?</h2>

                    <div>
                        <label htmlFor="ownerName" className="multistep">
                            Owner&apos;s name
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="ownerName"
                                {...register('ownerName', {
                                    required: "Please enter the owner's name",
                                })}
                                className="multistep"
                            />
                            {errors.ownerName && (
                                <p className="multistep error">
                                    {errors.ownerName.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="ownerRelationship"
                            className="multistep"
                        >
                            Relationship to owner
                        </label>
                        <div>
                            <input
                                type="text"
                                id="ownerRelationship"
                                {...register('ownerRelationship', {
                                    required:
                                        'Please enter your relationship to the owner',
                                })}
                                // autoComplete="street-address"
                                className="multistep"
                            />
                            {errors.ownerRelationship && (
                                <p className="multistep error">
                                    {errors.ownerRelationship.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            const output = await trigger(
                                ['ownerName', 'ownerRelationship'],
                                {
                                    shouldFocus: true,
                                }
                            )
                            if (output) {
                                next(9)
                            }
                        }}
                        className="multistep button"
                    >
                        Continue
                    </button>
                </>
            )}
            {step === 9 && (
                <Step9
                    setStep={setStep}
                    preferences={preferences}
                    setPreferences={setPreferences}
                />
            )}
            {step === 10 && (
                <Step10
                    setStep={setStep}
                    preferences={preferences}
                    setPreferences={setPreferences}
                />
            )}
            {step === 11 && (
                <>
                    <h2 className="multistep">Our recommendation:</h2>
                    <div>
                        <label htmlFor="contactName" className="multistep">
                            Name
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="contactName"
                                {...register('contactName', {
                                    required: 'Please type your full name',
                                })}
                                className="multistep"
                            />
                        </div>
                        {errors.contactName && (
                            <p className="multistep error">
                                {errors.contactName.message}
                            </p>
                        )}
                    </div>
                    <div className="col-span-full mt-3">
                        <label htmlFor="contactPhone" className="multistep">
                            Phone number
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="contactPhone"
                                {...register('contactPhone', {
                                    required: 'Please enter your phone number',
                                })}
                                className="multistep"
                            />
                            {errors.contactPhone && (
                                <p className="multistep error">
                                    {errors.contactPhone.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        onClick={async () => {
                            const output = await trigger(
                                ['contactName', 'contactPhone'],
                                {
                                    shouldFocus: true,
                                }
                            )
                            if (output) {
                                next(12)
                            }
                        }}
                        className="multistep button"
                    >
                        Submit referral
                    </button>
                </>
            )}
            {step === 12 && (
                <>
                    <h2 className="multistep">
                        Congrats on finding your perfect ADU!
                    </h2>
                    <p>Backyard Estates will call within 24 hours.</p>
                </>
            )}
        </form>
    )
}
