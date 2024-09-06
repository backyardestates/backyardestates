import style from './Tooltip.module.css'

export default function Tooltip({ show = false, children }) {
    return (
        <div className={show ? style.tooltip_show : style.tooltip_hide}>
            <div className={style.content}>{children}</div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="49"
                height="24"
                viewBox="0 0 49 24"
                fill="none"
                className={style.knob}
            >
                <g clipPath="url(#clip0_323_960)">
                    <path
                        d="M48.5 0H0.5V12H9.18629C11.308 12 13.3429 12.8429 14.8431 14.3431L23.0858 22.5858C23.8668 23.3668 25.1332 23.3668 25.9142 22.5858L34.1569 14.3431C35.6571 12.8429 37.692 12 39.8137 12H48.5V0Z"
                        fill="#36484B"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_323_960">
                        <rect width="49" height="24" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        </div>
    )
}
