import ButtonTag from '../ButtonTag'
import style from './ExploreButtonTags.module.css'

export default function ExploreButtonTags({
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
                            id={tag.orderID} // id vs. orderID on homepage
                            label={tag.name} // title vs. name on homepage
                            setSelected={setSelected}
                            selectedID={selectedID}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}
