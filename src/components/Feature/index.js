import Image from 'next/image'

import style from './Feature.module.css'

export default function Feature({ content }) {
    return (
        <div className={style.base}>
            <Image
                src={`/images/features/${content.image}`}
                width={203}
                height={114}
                alt="FPO"
            />
            <h3>{content.header}</h3>
            <p
                dangerouslySetInnerHTML={{ __html: content.text }}
                className={style.content}
            ></p>
        </div>
    )
}
