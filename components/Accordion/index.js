import { useState, useContext, useEffect } from 'react'
import AccordionPanel from '@/components/AccordionPanel'
import { PreviewContext } from '@/components/InclusionsPanel'

import { COLLECTIONS } from '@/content/inclusions'

import style from './Accordion.module.css'

export default function Accordion({ content }) {
    const [selectPanel, setSelectPanel] = useState(-1)

    function handleClick(id) {
        setSelectPanel(id)
    }

    const { preview, setPreview } = useContext(PreviewContext)

    const updatePreview = (changes) => {
        setPreview({ ...preview, ...changes })
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
                    {feature.options.length !== 0 && (
                        <ul className={style.options}>
                            {feature.options.map((option, index) => (
                                <li
                                    key={index}
                                    className={
                                        // if the selected cabinets equal the cabinets in collection
                                        preview.kitchenCabinets === option
                                            ? style.selected
                                            : ''
                                    }
                                    onClick={() =>
                                        updatePreview({
                                            kitchenCabinets: option,
                                            collection:
                                                option !==
                                                COLLECTIONS[
                                                    preview.collectionID
                                                ].rooms[0].cabinet
                                                    ? 'custom'
                                                    : option,
                                            isCustom:
                                                option !==
                                                COLLECTIONS[
                                                    preview.collectionID
                                                ].rooms[0].cabinet
                                                    ? true
                                                    : false,
                                        })
                                    }
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
