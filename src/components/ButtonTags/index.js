// import { useState } from 'react'
import ButtonTag from '@/components/ButtonTag'
import style from './ButtonTags.module.css'

export default function ButtonTags({
    tags,
    selectedID,
    setSelected,
    showAll = false,
}) {
    // showAll ? (selectedID = 99) : (selectedID = 1)
    return (
        <div className={style.base}>
            <ul className={style.tags}>
                {showAll && (
                    <li key={99}>
                        <ButtonTag
                            id={99}
                            label="All"
                            setSelected={setSelected}
                            selectedID={selectedID}
                        />
                    </li>
                )}
                {tags.map((tag, index) => (
                    <li key={index}>
                        <ButtonTag
                            id={index}
                            label={tag.frontmatter.title}
                            setSelected={setSelected}
                            // setChosen={setChosen}
                            selectedID={selectedID}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}
