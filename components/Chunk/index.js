import Image from 'next/image'
import style from './Chunk.module.css'

export default function Chunk({
    image,
    imageAlt = 'Default alt text',
    imagePriority = false,
    imageRight = false,
    title,
    children,
}) {
    return (
        <div className={imageRight ? style.imageRight : style.imageLeft}>
            <Image
                src={image}
                alt={imageAlt}
                className={style.image}
                width={427}
                height={240}
                priority={imagePriority}
            />
            <div className={style.content}>
                <h2 className={style.display2}>{title}</h2>
                {children}
            </div>
        </div>
    )
}
