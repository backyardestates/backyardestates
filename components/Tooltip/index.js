import style from './Tooltip.module.css'

export default function Tooltip({ show = false, children }) {
    return (
        <div className={show ? style.tooltip_show : style.tooltip_hide}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="48"
                viewBox="0 0 24 48"
                fill="none"
            >
                <path
                    d="M24 48L24 0L20 0C15.5817 0 12 3.58172 12 8V8.68629C12 10.808 11.1571 12.8429 9.65685 14.3431L1.41421 22.5858C0.633165 23.3668 0.633165 24.6332 1.41421 25.4142L9.65685 33.6569C11.1571 35.1571 12 37.192 12 39.3137V40C12 44.4183 15.5817 48 20 48H24Z"
                    fill="#36484B"
                />
            </svg>
            <div className={style.content}>{children}</div>
        </div>
    )
}
