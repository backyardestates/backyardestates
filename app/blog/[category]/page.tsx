import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Masthead from '@/components/Masthead'
import Link from 'next/link'

import style from '../blog.module.css'

const CATEGORY_QUERY = defineQuery(`*[
	_type == "category" &&
	slug.current == $category
  ][0]`)

const POST_QUERY = defineQuery(`*[
    _type == "post" &&
    $categoryId in categories[]._ref
  ]{title, slug}`)

export default async function Category({
    params,
}: {
    params: Promise<{ category: string }>
}) {
    const { data: category } = await sanityFetch({
        query: CATEGORY_QUERY,
        params: await params,
    })

    // Fetch posts that reference the category
    const { data: posts } = await sanityFetch({
        query: POST_QUERY,
        params: { categoryId: category._id }, // Pass the category's _id
    })

    if (!category) {
        notFound()
    }

    return (
        <>
            <Nav />
            <Masthead
                title={category.title}
                explanation="Your go-to resource for everything related to Accessory Dwelling Units (ADUs). Stay updated with the latest trends, tips, and stories from our community."
            />
            <main className={style.main}>
                <h2
                    className={style.headline}
                >{`Display all posts for ${category.title} category page`}</h2>
                <ul>
                    {posts.map((post, index) => (
                        <li key={index}>
                            <Link
                                href={`/blog/#/${post.slug.current}`}
                                className={style.blogLink}
                            >
                                {post.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </main>
            <Footer />
        </>
    )
}
