import { useState } from 'react'

import style from './Checkbox.module.css'

export default function Checkbox({
    name,
    label,
    explanation,
    errorMessage,
    error,
}: {
    name: string
    label: string
    explanation?: React.ReactNode
    errorMessage?: string
    error?: boolean
}) {
    const [isChecked, setIsChecked] = useState(false)

    const toggleCheckbox = () => {
        setIsChecked((prev) => !prev)
    }
    return (
        <div className={style.base}>
            <input
                aria-hidden="true"
                type="checkbox"
                name={name}
                id={name}
                value="on"
                checked={isChecked}
                onChange={toggleCheckbox}
                className={style.hidden}
            />
            <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                data-state={isChecked ? 'checked' : 'unchecked'}
                value="on"
                onClick={toggleCheckbox}
                className={style.checkbox}
            >
                <span data-state={isChecked ? 'checked' : 'unchecked'}>
                    {isChecked && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            className={style.checkmark}
                        >
                            <path
                                d="M5 11.5L9 14.5L15.5 5"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </span>
            </button>
            <div>
                <label className={style.label}>{label}</label>
                <p className={style.explanation}>{explanation}</p>
                {error && !isChecked && (
                    <p className={style.error}>{errorMessage}</p>
                )}
            </div>
        </div>
    )
}
