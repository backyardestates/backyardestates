import { useState } from 'react'

import Radio from '@/components/Radio'

import style from './RadioGroup.module.css'

export default function RadioGroup({
    name,
    options,
}: {
    name: string
    options: { label: string; value: string }[]
}) {
    const [selected, setSelected] = useState<string | null>(null)

    return (
        <div className={style.base}>
            <label className={style.label}>How did you hear about us?</label>
            <p
                style={{ color: 'magenta', marginBottom: '1rem' }}
            >{`selectedValue: ${selected}`}</p>
            <div className={style.options}>
                {options.map((option) => (
                    <Radio
                        key={option.value}
                        name={name}
                        value={option.value}
                        isChecked={selected === option.value}
                        onClick={() => {
                            setSelected(option.value)
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
