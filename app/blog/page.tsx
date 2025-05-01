import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'

import style from './blog.module.css'

const POST_QUERY = defineQuery(`*[
	_type == "post"
  ]{title, slug, categories[0]->{slug}}`)

export default async function Blog() {
    const { data: posts } = await sanityFetch({
        query: POST_QUERY,
    })

    if (!posts) {
        notFound()
    }

    return (
        <>
            <Nav />
            <Masthead
                title="Blog"
                explanation="Your go-to resource for everything related to Accessory Dwelling Units (ADUs). Stay updated with the latest trends, tips, and stories from our community."
            />
            <main className={style.main}>
                <ul>
                    {posts.map((post, index) => (
                        <li key={index}>
                            <Link
                                href={`/blog/${post.categories.slug.current}/${post.slug.current}`}
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
