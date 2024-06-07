import AccordionHeader from '@/components/AccordionHeader'

import style from './AccordionPanel.module.css'

export default function AccordionPanel({
    id,
    label,
    children,
    isOpen,
    handler,
}) {
    return (
        <div className={style.base}>
            <AccordionHeader id={id} handler={handler} isOpen={isOpen}>
                {label}
            </AccordionHeader>
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
