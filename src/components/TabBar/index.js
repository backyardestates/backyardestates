import TabBarButton from '../TabBarButton'
import style from './TabBar.module.css'

export default function TabBar() {
    return (
        <ul className={style.base}>
            <li>
                <TabBarButton isSelected>Contemporary light</TabBarButton>
            </li>
            <li>
                <TabBarButton>Contemporary dark</TabBarButton>
            </li>
            <li>
                <TabBarButton>Modern Blue</TabBarButton>
            </li>
            <li>
                <TabBarButton>Modern monochrome</TabBarButton>
            </li>
            <li>
                <TabBarButton>Urban olive</TabBarButton>
            </li>
        </ul>
    )
}
