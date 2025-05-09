import { useState } from 'react'

import style from './Radio.module.css'

export default function Radio({
    name,
    value,
    isChecked,
    onClick,
}: {
    name: string
    value: string
    isChecked: boolean
    onClick: () => void
}) {
    const [checked, setChecked] = useState(false)

    return (
        <label className={style.base}>
            <input
                type="radio"
                name={name}
                value={value}
                className={style.hidden}
                checked={isChecked}
                // onChange={() => onClick(value)} // Notify parent when selected
                required
            />
            <button
                type="button"
                role="radio"
                aria-checked={isChecked}
                data-state={isChecked ? 'checked' : 'unchecked'}
                className={style.radio}
                onClick={() => {
                    setChecked(!checked)
                    onClick()
                }}
            >
                <div className={style.disc} />
            </button>
            <span className={style.option}>{value}</span>
        </label>
    )
}
