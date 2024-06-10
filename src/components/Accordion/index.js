import { useState } from 'react'

import AccordionHeader from '@/components/AccordionHeader'
import AccordionPanel from '@/components/AccordionPanel'

import style from './Accordion.module.css'

export default function Accordion({ children }) {
    const [selectPanel, setSelectPanel] = useState(0)

    function handleClick(id) {
        setSelectPanel(id)
    }

    return (
        <div className={style.base}>
            {children.map((child, index) => (
                <AccordionPanel
                    id={index}
                    label={child.props.label}
                    key={index}
                    isOpen={selectPanel === index ? true : false}
                    handler={handleClick}
                >
                    {child.props.children}
                </AccordionPanel>
            ))}
        </div>
    )
}
