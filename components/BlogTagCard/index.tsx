import Image from 'next/image'

import style from './BlogTagCard.module.css'

export default function BlogCard({ post, tag, size = 'MD', featured = false }) {
    const formattedDate = new Date(post._updatedAt).toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
    )

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
            {size === 'LG' ? (
                <Image
                    src="https://fpoimg.com/400x350?text=Preview&bg_color=e6e6e6&text_color=8F8F8F"
                    className={style.image}
                    alt="Blog Post Image"
                />
            ) : null}
            <div className={style.content}>
                <div className={style.header}>
                    <h2 className={style.title}>{post.title}</h2>
                </div>
                <p className={style.dateCreated}>{formattedDate}</p>
            </div>
        </a>
    )
}
