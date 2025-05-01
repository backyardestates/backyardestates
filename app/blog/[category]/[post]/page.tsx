import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'
import { PortableText } from 'next-sanity'

import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'

import style from '../../blog.module.css'
import Link from 'next/link'

const POST_QUERY = defineQuery(`*[
	_type == "post" &&
	slug.current == $post
  ][0]{title, description, content, categories[0]->{title, slug}}`)

export default async function Category({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { data: post } = await sanityFetch({
        query: POST_QUERY,
        params: await params,
    })

    if (!post) {
        notFound()
    }

    return (
        <>
            <Nav />
            <Masthead title={post.title} explanation={post.description} />
            <main className={style.main}>
                <PortableText value={post.content} />
                <h3>Tags</h3>
                <ul>
                    <li>
                        <Link
                            href={`/blog/${post.categories.slug.current}`}
                            className={style.blogLink}
                        >
                            {post.categories.title}
                        </Link>
                    </li>
                </ul>
            </main>
            <Footer />
        </>
    )
}
