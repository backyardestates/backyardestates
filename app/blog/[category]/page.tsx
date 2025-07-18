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
    `*[_type == "category" && slug.current == $category]`
)

const POST_QUERY_LG = defineQuery(
    `*[_type == "post" && categories->slug.current == $category][0...1]{title, slug, _updatedAt, categories->{slug}}`
)

const POST_QUERY_MD = defineQuery(
    `*[_type == "post" && categories->slug.current == $category][1...5]{title, slug, _updatedAt, categories->{slug}}`
)

export default async function Category({
    params,
}: {
    params: Promise<{ category: string }>
}) {
    // console.log('Category params', await params)
    // const categorySlug = await params.category
    // console.log('Category is ', categorySlug)
    const { data: category } = await sanityFetch({
        query: CATEGORY_QUERY,
        params: await params,
    })

    // console.log('Category is ', category)

    const { data: features } = await sanityFetch({
        query: POST_QUERY_LG,
        params: { category: category[0].slug.current },
    })

    // console.log('Features are ', features)

    const { data: posts } = await sanityFetch({
        query: POST_QUERY_MD,
        params: { category: category[0].slug.current },
    })

    // console.log('Posts are ', posts)

    if (!category || !features || !posts) {
        notFound()
    }

    const pages = [
        { title: 'Blog', href: '/blog' },
        { title: category[0].title, href: `/blog/${category[0].slug.current}` },
    ]

    return (
        <>
            <Nav />
            <Masthead
                title={category[0].title}
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
