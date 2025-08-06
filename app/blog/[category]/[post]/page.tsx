import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'
import { PortableText } from 'next-sanity'
import type { Metadata } from 'next'

type Props = {
    params: Promise<{ post: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { post } = await params

    const { data: postObj } = await sanityFetch({
        query: POST_QUERY,
        params: { post },
    })

    return {
        title: `${postObj?.title} - Blog - Backyard Estates`,
        description: `Read the latest post about ${postObj?.title}`,
    }
}

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'

import style from '../../blog.module.css'
import Breadcrumbs from '@/components/Breadcrumbs'
import Catchall from '@/components/Catchall'
import BlogCategory from '@/components/BlogCategory'
import BlogTag from '@/components/BlogTag'
import BlogAuthor from '@/components/BlogAuthor'
import BlogImage from '@/components/BlogImage'

const POST_QUERY = defineQuery(`*[
	_type == "post" &&
	slug.current == $post
  ][0]{title, image, author->{firstname, lastname, portrait}, _updatedAt, description, content, slug, categories->{title, slug}, tags[]->{title, slug}}`)

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
                    <BlogImage public_id={post.image.public_id} />
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
