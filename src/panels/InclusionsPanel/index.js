import TabBar from '@/components/TabBar'
import style from './InclusionsPanel.module.css'

export default function InclusionsPanel() {
    return (
        <div className={style.base}>
            <div className={style.header}>
                <p className={style.subhead}>Choose your preferred package</p>
                <TabBar />
            </div>
            <div className={style.rooms}>
                <ul>
                    <li>
                        <a href="#">Kitchen</a>
                    </li>
                    <li>
                        <a href="#">Bathroom</a>
                    </li>
                    <li>
                        <a href="#">Interior features</a>
                    </li>
                    <li>
                        <a href="#">Exterior features</a>
                    </li>
                    <li>
                        <a href="#">Construction specifications</a>
                    </li>
                </ul>
            </div>
            <div className={style.preview}>Preview</div>
            <div className={style.sidebar}>Sidebar</div>
            <div className={style.description}>
                This contemporary look combines muted grays with white accents,
                enhanced by a light off-white interior paint. The result is a
                bold yet understated style.
            </div>
        </div>
    )
}
