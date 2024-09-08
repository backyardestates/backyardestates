'use client'

import { useRouter } from 'next/navigation'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-solid-svg-icons'

import Logo from '@/components/Logo'
import OpenGraph from '@/components/OpenGraph'

import style from './Form.module.css'
import MultiStepForm from '@/components/MultiStepForm'

export default function SubmitReferral() {
    const router = useRouter()

    function goBack() {
        router.back()
    }

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
