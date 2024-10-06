import ButtonTag from '../ButtonTag'
import style from './ButtonTags.module.css'

export default function ButtonTags({
    tags,
    selectedID,
    setSelected,
    showAll = false,
}) {
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
                            id={tag.id}
                            label={tag.title}
                            setSelected={setSelected}
                            selectedID={selectedID}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}
