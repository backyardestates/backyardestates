import style from './TabBarButton.module.css'

export default function TabBarButton({ children, isSelected = false }) {
    return (
        <a
            href="#"
            className={`${style.base} ${isSelected ? style.selected : ''}`}
        >
            {children}
        </a>
    )
}
