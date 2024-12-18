import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons'

import style from './FaqHeader.module.css'

export default function FaqHeader({ handler, isOpen, children }) {
    // const [isOpen, setIsOpen] = useState(false)

    return (
        <div className={isOpen ? style.selected : style.base} onClick={handler}>
            <span>{children}</span>
            {isOpen ? (
                <FontAwesomeIcon icon={faMinus} size="sm" />
            ) : (
                <FontAwesomeIcon icon={faPlus} size="sm" />
            )}
        </div>
    )
}
