export default function Divider({ size = 'tall' }) {
    return (
        <svg
            width="2"
            height={size === 'tall' ? '24' : '12'}
            viewBox={size === 'tall' ? '0 0 2 24' : '0 0 2 12'}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <line
                x1="1"
                y1="0"
                x2="1"
                y2={size === 'tall' ? '24' : '12'}
                stroke="#c4c4c4"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}
