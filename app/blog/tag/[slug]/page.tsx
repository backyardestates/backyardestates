// 'use client'

import { sanityFetch } from '@/sanity/live'
import {
    TAG_QUERY,
    POSTS_BY_TAG_QUERY_FEATURED,
    POSTS_BY_TAG_QUERY,
} from '@/sanity/queries'

import Advert from '@/components/Advert'
import Breadcrumbs from '@/components/Breadcrumbs'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Masthead from '@/components/Masthead'

import style from '../../blog.module.css'
import BlogTagCard from '@/components/BlogTagCard'

export default async function Tags({ params }) {
    const { slug } = await params

    // console.log(slug)

    const { data: tag } = await sanityFetch({
        query: TAG_QUERY,
        params: { slug: slug },
    })

    // console.log('Tag is', tag[0].slug.current)

    const { data: features } = await sanityFetch({
        query: POSTS_BY_TAG_QUERY_FEATURED,
        params: { tag: tag[0].slug.current },
    })

    const { data: posts } = await sanityFetch({
        query: POSTS_BY_TAG_QUERY,
        params: { tag: tag[0].slug.current },
    })

    const pages = [
        { title: 'Blog', href: '/blog' },
        { title: tag[0].title, href: `/blog/tag/${tag[0].slug.current}` },
    ]
    return (
        <>
            <Nav />
            <Masthead
                eyebrow="Tag"
                title={`${tag[0].title}`}
                showExplanation={false}
                explanation=""
            />
            <main className={style.main}>
                <Breadcrumbs pages={pages} />
                <div className={style.blogCards}>
                    {features.map((feature, index) => (
                        <BlogTagCard
                            key={index}
                            post={feature}
                            tag={tag[0].slug.current}
                            size="LG"
                            featured={true}
                            // type="tag"
                        />
                    ))}
                    <Advert />
                    {posts.map((post, index) => (
                        <BlogTagCard
                            key={index}
                            post={post}
                            tag={tag[0].slug.current}
                            size="MD"
                            featured={false}
                        />
                    ))}
                </div>
            </main>
            <Footer />
        </>
    )
}
