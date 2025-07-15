import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Masthead from '@/components/Masthead'
import BlogCard from '@/components/BlogCard'
import Advert from '@/components/Advert'
import Breadcrumbs from '@/components/Breadcrumbs'

import style from '../blog.module.css'

const CATEGORY_QUERY = defineQuery(
    `*[_type == "category" && slug.current == $category][0]`
)

const POST_QUERY_LG = defineQuery(
    `*[_type == "post" && categories[0]->slug.current == $category][0...1]{title, slug, _updatedAt, categories[0]->{slug}}`
)

const POST_QUERY_MD = defineQuery(
    `*[_type == "post" && categories[0]->slug.current == $category][1...5]{title, slug, _updatedAt, categories[0]->{slug}}`
)

export default async function Category({
    params,
}: {
    params: Promise<{ category: string }>
}) {
    const { data: category } = await sanityFetch({
        query: CATEGORY_QUERY,
        params: await params,
    })

    const { data: features } = await sanityFetch({
        query: POST_QUERY_LG,
        params: { category: category.slug.current },
    })

    const { data: posts } = await sanityFetch({
        query: POST_QUERY_MD,
        params: { category: category.slug.current },
    })

    if (!category || !features || !posts) {
        notFound()
    }

    const pages = [
        { title: 'Blog', href: '/blog' },
        { title: category.title, href: `/blog/${category.slug.current}` },
    ]

    return (
        <>
            <Nav />
            <Masthead
                title={category.title}
                showExplanation={false}
                explanation="Your go-to resource for everything related to Accessory Dwelling Units (ADUs). Stay updated with the latest trends, tips, and stories from our community."
            />
            <main className={style.main}>
                <Breadcrumbs pages={pages} />
                <div className={style.blogCards}>
                    {features.map((feature, index) => (
                        <BlogCard
                            key={index}
                            post={feature}
                            size="LG"
                            featured={true}
                            showCategory={false}
                        />
                    ))}
                    <Advert />
                    {posts.map((post, index) => (
                        <BlogCard
                            key={index}
                            post={post}
                            showCategory={false}
                        />
                    ))}
                </div>
            </main>
            <Footer />
        </>
    )
}
