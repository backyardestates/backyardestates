import { useState } from 'react'
import ButtonTag from '@/components/ButtonTag'
import style from './ButtonTags.module.css'

export default function ButtonTags({ tags, selectedID, setSelected }) {
    return (
        <div className={style.base}>
            <ul className={style.tags}>
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
