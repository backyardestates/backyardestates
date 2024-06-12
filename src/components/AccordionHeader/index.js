import { useState } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons'

import style from './AccordionHeader.module.css'

export default function AccordionHeader({
    id,
    children,
    isOpen = false,
    handler,
}) {
    function clickHandler() {
        if (isOpen) {
            handler(-1)
        } else {
            handler(id)
        }
    }

    return (
        <div
            className={isOpen ? style.selected : style.base}
            onClick={() => clickHandler()}
        >
            <span>{children}</span>
            {isOpen ? (
                <FontAwesomeIcon icon={faMinus} size="sm" />
            ) : (
                <FontAwesomeIcon icon={faPlus} size="sm" />
            )}
        </div>
    )
}
