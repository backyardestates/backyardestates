import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'
import { PortableText } from 'next-sanity'

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'

import style from '../../blog.module.css'
// import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import Catchall from '@/components/Catchall'
import BlogCategory from '@/components/BlogCategory'
import BlogTag from '@/components/BlogTag'
import BlogAuthor from '@/components/BlogAuthor'

const POST_QUERY = defineQuery(`*[
	_type == "post" &&
	slug.current == $post
  ][0]{title, author->{firstname, lastname, portrait}, _updatedAt, description, content, slug, categories->{title, slug}, tags[]->{title, slug}}`)

export default async function Post({
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

    const pages = [
        { title: 'Blog', href: '/blog' },
        {
            title: post.categories.title,
            href: `/blog/${post.categories.slug.current}`,
        },
        {
            title: post.title,
            href: `/blog/${post.categories.slug.current}/${post.slug.current}`,
        },
    ]

    const tags = post.tags

    return (
        <>
            <Nav />
            <main className={`${style.main} ${style.mainPadded}`}>
                <Breadcrumbs pages={pages} />
                <div className={style.content}>
                    <BlogCategory category={post.categories.title} />
                    <h1>{post.title}</h1>
                    <BlogAuthor author={post.author} date={post._updatedAt} />
                    <p className={style.description}>{post.description}</p>
                    <PortableText value={post.content} />
                    <h3>Blog post tags</h3>
                    <div className={style.tags}>
                        {tags.map((tag, index) => (
                            <BlogTag key={index} tag={tag} />
                        ))}
                    </div>
                </div>
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
