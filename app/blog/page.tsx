// 'use client'

import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'
// import Link from 'next/link'

import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import BlogCard from '@/components/BlogCard'

import style from './blog.module.css'
import Advert from '@/components/Advert'
import Breadcrumbs from '@/components/Breadcrumbs'

const POST_QUERY_MD = defineQuery(
    `*[_type == "post"][2...5]{title, slug, image, _updatedAt, categories->{slug}}`
)

const POST_QUERY_LG = defineQuery(
    `*[_type == "post"][0...2]{title, slug, image, _updatedAt, categories->{slug}}`
)

export default async function Blog() {
    const { data: features } = await sanityFetch({
        query: POST_QUERY_LG,
    })

    const { data: posts } = await sanityFetch({
        query: POST_QUERY_MD,
    })

    if (!posts || !features) {
        notFound()
    }

    const pages = [{ title: 'Blog', href: '/blog' }]

    return (
        <>
            <Nav />
            <Masthead
                title="Blog"
                explanation="Your go-to resource for everything related to Accessory Dwelling Units (ADUs) for the greater Los Angeles area."
            />
            <main className={style.main}>
                <Breadcrumbs pages={pages} />
                <div className={style.blogCards}>
                    {features.map((feature, index) => (
                        <BlogCard key={index} post={feature} size="LG" />
                    ))}
                    <Advert />
                    {posts.map((post, index) => (
                        <BlogCard key={index} post={post} />
                    ))}
                </div>
            </main>
            <Footer />
        </>
    )
}
