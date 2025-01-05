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
import Step11 from './Step11'
import NavigationTabs from './NavigationTabs'

export default function MultiStepForm() {
    const [step, setStep] = useState(0)

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
                setStep(14)
                setShowTabs(false)
            } else {
                const data = await response.json()
            }
        } catch (err) {
            //console.log('Failed to submit', err)
        }
    }

    const next = (nextStep: number) => {
        if (step === 13) {
            // console.log('Bnag')
            handleSubmit(onSubmit)
        } else {
            setStep(nextStep)
        }
    }

    const [showTabs, setShowTabs] = useState(true)
    const [tab, setTab] = useState(1)

    return (
        <>
            {showTabs && <NavigationTabs tab={tab} />}

            <form onSubmit={handleSubmit(onSubmit)}>
                {step === 0 && (
                    <>
                        <h2 className="multistep">Who are you?</h2>
                        <div>
                            <label htmlFor="referrerName" className="multistep">
                                Name
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="referrerName"
                                    {...register('referrerName', {
                                        required: 'Please type your full name',
                                    })}
                                    className="multistep"
                                />
                            </div>
                            {errors.referrerName && (
                                <p className="multistep error">
                                    {errors.referrerName.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="referrerEmail"
                                className="multistep"
                            >
                                Email
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="referrerEmail"
                                    {...register('referrerEmail', {
                                        validate: {
                                            maxLength: (v) =>
                                                v.length <= 50 ||
                                                'The email should have at most 50 characters',
                                            matchPattern: (v) =>
                                                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
                                                    v
                                                ) ||
                                                'Email address must be a valid address',
                                        },
                                    })}
                                    className="multistep"
                                />
                            </div>
                            {errors.referrerEmail && (
                                <p className="multistep error">
                                    {errors.referrerEmail.message}
                                </p>
                            )}
                        </div>
                        <div className="col-span-full mt-3">
                            <label
                                htmlFor="referrerPhone"
                                className="multistep"
                            >
                                Phone number
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="referrerPhone"
                                    {...register('referrerPhone', {
                                        required:
                                            'Please enter your phone number',
                                    })}
                                    className="multistep"
                                />
                                {errors.referrerPhone && (
                                    <p className="multistep error">
                                        {errors.referrerPhone.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                const output = await trigger(
                                    [
                                        'referrerName',
                                        'referrerPhone',
                                        'referrerEmail',
                                    ],
                                    {
                                        shouldFocus: true,
                                    }
                                )
                                if (output) {
                                    next(1)
                                    setTab(2)
                                }
                            }}
                            className="multistep button"
                        >
                            Continue
                        </button>
                    </>
                )}
                {step === 1 && (
                    <>
                        <h2 className="multistep">Who are you referring?</h2>
                        <div>
                            <label htmlFor="contactName" className="multistep">
                                Name
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="contactName"
                                    {...register('contactName', {
                                        required: 'Please enter their name',
                                    })}
                                    className="multistep"
                                />
                                {errors.contactName && (
                                    <p className="multistep error">
                                        {errors.contactName.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="contactEmail" className="multistep">
                                Email
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="contactEmail"
                                    {...register('contactEmail', {
                                        validate: {
                                            maxLength: (v) =>
                                                v.length <= 50 ||
                                                'The email should have at most 50 characters',
                                            matchPattern: (v) =>
                                                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
                                                    v
                                                ) ||
                                                'Email address must be a valid address',
                                        },
                                    })}
                                    className="multistep"
                                />
                            </div>
                            {errors.contactEmail && (
                                <p className="multistep error">
                                    {errors.contactEmail.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="contactPhone" className="multistep">
                                Phone number
                            </label>
                            <div>
                                <input
                                    type="text"
                                    id="ownerRelationship"
                                    {...register('contactPhone', {
                                        required:
                                            'Please enter their phone number',
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
                            type="button"
                            onClick={async () => {
                                const output = await trigger(
                                    [
                                        'contactName',
                                        'contactPhone',
                                        'contactEmail',
                                    ],
                                    {
                                        shouldFocus: true,
                                    }
                                )
                                if (output) {
                                    next(2)
                                }
                            }}
                            className="multistep button"
                        >
                            Continue
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 className="multistep">
                            What is their property address?
                        </h2>

                        <div>
                            <label
                                htmlFor="propertyAddress"
                                className="multistep"
                            >
                                Property address
                            </label>
                            <div>
                                <input
                                    type="text"
                                    id="propertyAddress"
                                    {...register('propertyAddress', {
                                        required:
                                            'Please enter their property address',
                                    })}
                                    className="multistep"
                                />
                                {errors.propertyAddress && (
                                    <p className="multistep error">
                                        {errors.propertyAddress.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                const output = await trigger(
                                    ['propertyAddress'],
                                    {
                                        shouldFocus: true,
                                    }
                                )
                                if (output) {
                                    next(3)
                                }
                            }}
                            className="multistep button"
                        >
                            Continue
                        </button>
                    </>
                )}

                {step === 3 && (
                    <Step7
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                    />
                )}

                {step === 4 && (
                    <>
                        <h2 className="multistep">
                            Who is the property owner?
                        </h2>

                        <div>
                            <label htmlFor="ownerName" className="multistep">
                                Owner&apos;s name
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="ownerName"
                                    {...register('ownerName', {
                                        required:
                                            "Please enter the owner's name",
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
                                Their relationship to owner
                            </label>
                            <div>
                                <input
                                    type="text"
                                    id="ownerRelationship"
                                    {...register('ownerRelationship', {
                                        required:
                                            'Please enter your relationship to the owner',
                                    })}
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
                                    next(5)
                                }
                            }}
                            className="multistep button"
                        >
                            Continue
                        </button>
                    </>
                )}

                {step === 5 && (
                    <Step1
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                    />
                )}

                {step === 6 && (
                    <>
                        <h2 className="multistep">
                            Tell us why they need an ADU
                        </h2>
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
                                    next(7)
                                }
                            }}
                            className="multistep button"
                        >
                            Contine
                        </button>
                    </>
                )}
                {step === 7 && (
                    <Step3
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                    />
                )}
                {step === 8 && (
                    <Step4
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                    />
                )}
                {step === 9 && (
                    <Step6
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                    />
                )}

                {step === 10 && (
                    <Step9
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                    />
                )}
                {step === 11 && (
                    <Step10
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                    />
                )}
                {step === 12 && (
                    <Step11
                        setStep={setStep}
                        preferences={preferences}
                        setPreferences={setPreferences}
                        setTab={setTab}
                    />
                )}
                {step === 13 && (
                    <>
                        <h2 className="multistep">How we can best help you?</h2>
                        <div>
                            <div>
                                <textarea
                                    id="specificHelp"
                                    {...register('specificHelp', {
                                        required:
                                            'Please describe how we can help.',
                                    })}
                                    className="multistep"
                                    rows={5}
                                />
                                {errors.specificHelp && (
                                    <p className="multistep error">
                                        {errors.specificHelp.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            type="submit"
                            onClick={async () => {
                                const output = await trigger('specificHelp', {
                                    shouldFocus: true,
                                })
                                if (output) {
                                    next(14)
                                }
                            }}
                            className="multistep button"
                        >
                            Submit referral
                        </button>
                    </>
                )}

                {step === 14 && (
                    <>
                        <h2 className="multistep">
                            Thank you for your referral
                        </h2>
                        <p>Backyard Estates will call within 24 hours.</p>
                    </>
                )}
            </form>
        </>
    )
}
