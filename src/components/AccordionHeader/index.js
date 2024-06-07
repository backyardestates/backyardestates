import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons'

import style from './AccordionHeader.module.css'

export default function AccordionHeader({
    id,
    children,
    isOpen = false,
    handler,
}) {
    return (
        <div className={style.base} onClick={() => handler(id)} isOpen={isOpen}>
            {/* <span>{id}</span> */}
            {/* <span>{isOpen ? 'T' : 'F'}</span> */}
            <span>{children}</span>
            {isOpen ? (
                <FontAwesomeIcon icon={faMinus} size="sm" />
            ) : (
                <FontAwesomeIcon icon={faPlus} size="sm" />
            )}
        </div>
    )
}
