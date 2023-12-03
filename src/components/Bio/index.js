import Image from 'next/image'
import style from './Bio.module.css'

export default function Bio({ portrait, name, title, children }) {
    return (
        <div className={style.root}>
            <Image
                src={`/portraits/${portrait}`}
                alt={`Portrait image of ${name}`}
                className={style.image}
                width={300}
                height={350}
            />
            <div className={style.content}>
                <h2 className={style.display2}>{name}</h2>
                <h3 className={style.small_caps}>{title}</h3>
                <p className={style.body}>{children}</p>
            </div>
        </div>
    )
}
