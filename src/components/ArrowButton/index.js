import style from './ArrowButton.module.css'

export default function Arrow({ direction = 'right' }) {
    return (
        <div>
            <button className={style.base}>
                {direction === 'left' && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                    >
                        <path
                            d="M26 30L20 24L26 18"
                            stroke="white"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                )}

                {direction === 'right' && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                    >
                        <path
                            d="M22 30L28 24L22 18"
                            stroke="white"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                )}
            </button>
        </div>
    )
}
