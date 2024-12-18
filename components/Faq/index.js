'use client'
import { useState } from 'react'
import FaqHeader from '@/components/FaqHeader'

import style from './Faq.module.css'

export default function Faq({ question, children }) {
    const [isOpen, setIsOpen] = useState(false)

    function handlerClick() {
        setIsOpen(!isOpen)
    }

    return (
        <div className={style.base}>
            <FaqHeader handler={handlerClick} isOpen={isOpen}>
                {question}
            </FaqHeader>
            <div
                className={`${style.base} ${
                    isOpen ? style.open : style.closed
                }`}
            >
                {children}
            </div>
        </div>
    )
}
