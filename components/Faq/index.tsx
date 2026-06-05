'use client'

import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

import style from './Faq.module.css'

export interface FaqCta {
    label: string
    href: string
}

interface FaqProps {
    question: string
    children: ReactNode
    /** Subtle contextual action shown beneath the answer. */
    cta?: FaqCta
}

export default function Faq({ question, children, cta }: FaqProps) {
    const [isOpen, setIsOpen] = useState(false)
    const regionId = useId()

    return (
        <div className={`${style.item} ${isOpen ? style.itemOpen : ''}`}>
            <button
                type="button"
                className={style.trigger}
                aria-expanded={isOpen}
                aria-controls={regionId}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span className={style.question}>{question}</span>
                <span className={style.chip} aria-hidden="true">
                    <span className={style.chipBar} />
                    <span className={`${style.chipBar} ${style.chipBarV}`} />
                </span>
            </button>

            {/* 0fr → 1fr grid rows animate the natural content height. */}
            <div id={regionId} role="region" className={style.reveal}>
                <div className={style.revealClip}>
                    <div className={style.body}>
                        <div className={style.answer}>{children}</div>
                        {cta && (
                            <div className={style.ctaRow}>
                                <Link href={cta.href} className={style.cta}>
                                    {cta.label}
                                    <span
                                        className={style.ctaArrow}
                                        aria-hidden="true"
                                    >
                                        →
                                    </span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
