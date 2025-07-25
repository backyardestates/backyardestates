'use client'

import { CldImage } from 'next-cloudinary'

import style from './BlogImage.module.css'

export default function BlogImage({ public_id }: { public_id: any }) {
    // console.log('public_id', public_id)

    return (
        <div className={style.base}>
            <CldImage
                src={public_id}
                alt="Blog Post Image"
                fill
                style={{ objectFit: 'cover' }}
                sizes="100vw"
                priority
            />
        </div>
    )
}
