import { useState } from 'react'
import AccordionPanel from '@/components/AccordionPanel'

import style from './Accordion.module.css'

export default function Accordion({ content }) {
    const [selectPanel, setSelectPanel] = useState(-1)

    function handleClick(id) {
        setSelectPanel(id)
    }

    return (
        <div className={style.base}>
            {content.features.map((feature, index) => (
                <AccordionPanel
                    id={index}
                    label={feature.header}
                    key={index}
                    isOpen={selectPanel === index ? true : false}
                    handler={handleClick}
                >
                    <p
                        dangerouslySetInnerHTML={{ __html: feature.text }}
                        className={style.content}
                    ></p>
                </AccordionPanel>
            ))}
        </div>
    )
}

/*

*/
