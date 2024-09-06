import style from './Inspector.module.css'

export default function Inspector({ inView = false, showMenu }) {
    return (
        <div className={style.base}>
            <h3>Inspector</h3>
            <p>{`inView: ${inView}`}</p>
            <p>{`showMenu: ${showMenu}`}</p>
        </div>
    )
}
