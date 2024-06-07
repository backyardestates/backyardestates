import Image from 'next/image'

import style from './ImageBarButton.module.css'

export default function ImageBarButton({ isSelected = false }) {
    return (
        <div className={`${style.base} ${isSelected ? style.selected : ''}`}>
            <Image
                src="/images/preview/preview-FPO.png"
                alt="Picture of the author"
                width={100}
                height={100}
                className={style.image}
            />
        </div>
    )
}
