import style from './Tab.module.css'

export default function Tab({ index, children, isSelected, handler }) {
    return (
        <div
            className={isSelected ? style.selected : style.notSelected}
            onClick={() => handler(index)}
        >
            {children}
        </div>
    )
}
