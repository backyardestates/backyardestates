// import Link from 'next/link'
import style from './Dropdown.module.css'

import { useState } from 'react'

export default function Dropdown({ isHomepage = false, label, children }) {
    const [visibility, setVisibility] = useState(false)
    return (
        <div className={isHomepage ? style.dark : style.light}>
            <button
                type="button"
                className={style.btn}
                onClick={() => setVisibility((visibility) => !visibility)}
            >
                {label}
            </button>
            <div
                className={
                    visibility
                        ? style.dropdown_menu
                        : style.dropdown_menu_hidden
                }
                onMouseLeave={() => setVisibility(false)}
            >
                {children}
            </div>
        </div>
    )
}
