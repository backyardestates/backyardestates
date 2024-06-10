import style from './TabBarButton.module.css'

export default function TabBarButton({ children, handler, collection, value }) {
    return (
        <div
            href="#"
            className={`${style.base} ${
                collection === value ? style.selected : ''
            }`}
            onClick={() => handler(value)}
        >
            {children}
        </div>
    )
}
