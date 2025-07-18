'use client'

import { Cloudinary } from '@cloudinary/url-gen'
// import { AdvancedImage, responsive } from '@cloudinary/react'
const cld = new Cloudinary({
    cloud: {
        cloudName: 'backyardestates',
    },
})
import { CldImage } from 'next-cloudinary'
import style from './BlogAuthor.module.css'

export default function BlogAuthor({ author, date }) {
    // console.log('Author', author.portrait.public_id)
    const myImage = cld.image(author.portrait.public_id)
    // console.log('Image', myImage)

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    return (
        <div className={style.base}>
            <CldImage
                src={author.portrait.public_id}
                width="64"
                height="64"
                className={style.image}
                alt={`${author.firstname} ${author.lastname}`}
            />
            <span
                className={style.name}
            >{`${author.firstname} ${author.lastname}`}</span>
            <span className={style.date}>{`${formattedDate}`}</span>
        </div>
    )
}
