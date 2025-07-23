import BlogCategory from '../BlogCategory'
import Image from 'next/image'

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
                    src="/images/fpo-320-180@3x.png"
                    className={style.image}
                    alt="Blog post thumbnail"
                    width={320}
                    height={180}
                    // fill={true}
                />
            ) : null}
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
