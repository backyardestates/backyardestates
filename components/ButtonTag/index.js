import style from './ButtonTag.module.css'

export default function ButtonTag({ id, selectedID, label, setSelected }) {
    return (
        <button
            className={selectedID === id ? style.selected : style.not_selected}
            onClick={() => setSelected(id)}
        >
            {label}
        </button>
    )
}
