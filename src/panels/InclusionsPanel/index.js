import TabBar from '@/components/TabBar'
import Image from 'next/image'
import style from './InclusionsPanel.module.css'
import ImageBar from '@/components/ImageBar'

export default function InclusionsPanel() {
    return (
        <div className={style.base}>
            <div className={style.interface}>
                <div className={style.header}>
                    <p className={style.subhead}>
                        Choose your preferred package
                    </p>
                    <TabBar />
                </div>
                <div className={style.rooms}>
                    <ImageBar />
                </div>
                <div className={style.preview}>
                    <Image
                        src="/images/preview/preview-FPO.png"
                        width={790}
                        height={790}
                        alt="Picture of the author"
                        // fill={true}
                        className={style.previewImage}
                    />
                </div>
                <div className={style.sidebar}>Sidebar</div>
                <div className={style.description}>
                    This contemporary look combines muted grays with white
                    accents, enhanced by a light off-white interior paint. The
                    result is a bold yet understated style.
                </div>
            </div>
        </div>
    )
}
