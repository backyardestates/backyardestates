import { useState, useContext } from 'react'
import AccordionPanel from '@/components/AccordionPanel'
import { PreviewContext } from '@/components/InclusionsPanel'

import style from './Accordion.module.css'

export default function Accordion({ content }) {
    const [selectPanel, setSelectPanel] = useState(-1)

    function handleClick(id) {
        setSelectPanel(id)
    }

    const { preview, setPreview } = useContext(PreviewContext)

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
                    {feature.options.length !== 0 && (
                        <ul className={style.options}>
                            {feature.options.map((option, index) => (
                                <li
                                    key={index}
                                    className={
                                        preview.kitchenCabinets === option
                                            ? style.selected
                                            : ''
                                    }
                                    onClick={() => {
                                        setPreview({
                                            collection:
                                                option !== 'White'
                                                    ? 'custom'
                                                    : 'light',
                                            room: preview.room,
                                            isCustom:
                                                option !== 'White'
                                                    ? true
                                                    : false,
                                            kitchenCabinets: option,
                                        })
                                    }}
                                >
                                    {option}
                                </li>
                            ))}
                        </ul>
                    )}
                </AccordionPanel>
            ))}
        </div>
    )
}
