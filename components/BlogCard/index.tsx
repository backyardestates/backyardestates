'use client'

import { CldImage } from 'next-cloudinary'

// import { Cloudinary } from '@cloudinary/url-gen'

// // Import the responsive plugin
// import { AdvancedImage, responsive } from '@cloudinary/react'

// // Create and configure your Cloudinary instance.
// const cld = new Cloudinary({
//     cloud: {
//         cloudName: 'backyardestates',
//     },
// })

import BlogCategory from '../BlogCategory'
// import Image from 'next/image'

import style from './BlogCard.module.css'

export default function BlogCard({
    post,
    size = 'MD',
    featured = false,
    showCategory = true,
}) {
    const formattedDate = new Date(post._updatedAt).toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
    )

    // const postImage = cld.image()
    return (
        <a
            href={`/blog/${post.categories.slug.current}/${post.slug.current}`}
            className={size === 'MD' ? style.MD : style.LG}
            aria-label="View details for Product Name"
            style={
                featured
                    ? {
                          gridColumn: 'span 2',
                          gridRow: 'span 2',
                      }
                    : {}
            }
        >
            {size === 'LG' && (
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                    }}
                >
                    <CldImage
                        src={post.image.public_id}
                        alt="Blog Post Image"
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="100vw"
                        priority
                    />
                </div>
            )}
            <div className={style.content}>
                <div className={style.header}>
                    {showCategory && (
                        <BlogCategory category={post.categories.slug.current} />
                    )}
                    <h2 className={style.title}>{post.title}</h2>
                </div>
                <p className={style.dateCreated}>{formattedDate}</p>
            </div>
        </a>
    )
}
