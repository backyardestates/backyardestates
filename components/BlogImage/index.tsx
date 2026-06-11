'use client'

import { CldImage } from 'next-cloudinary'

import style from './BlogImage.module.css'

export default function BlogImage({
    public_id,
    alt,
}: {
    public_id: any
    alt?: string
}) {
    return (
        <div className={style.base}>
            <CldImage
                src={public_id}
                alt={alt || 'Backyard Estates ADU blog post'}
                fill
                style={{ objectFit: 'cover' }}
                sizes="100vw"
                priority
            />
        </div>
    )
}
