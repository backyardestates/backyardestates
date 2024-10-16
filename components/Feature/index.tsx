import Image from 'next/image'

import style from './Feature.module.css'

export default function Feature({ content }) {
    const showImage: Boolean = false

    return (
        <div className={style.base}>
            {showImage && (
                <Image
                    src={`/images/inclusions/features/${content.image}`}
                    width={203}
                    height={114}
                    alt="FPO"
                />
            )}
            <h3>{content.header}</h3>
            <p
                dangerouslySetInnerHTML={{ __html: content.text }}
                className={style.content}
            ></p>
        </div>
    )
}
