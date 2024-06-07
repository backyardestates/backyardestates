import ImageBarButton from '@/components/ImageBarButton'
import style from './ImageBar.module.css'

export default function ImageBar() {
    return (
        <ul className={style.base}>
            <li>
                <ImageBarButton isSelected />
            </li>
            <li>
                <ImageBarButton />
            </li>
            <li>
                <ImageBarButton />
            </li>
            <li>
                <ImageBarButton />
            </li>
            <li>
                <ImageBarButton />
            </li>
        </ul>
    )
}
