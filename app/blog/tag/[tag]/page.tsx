import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Masthead from '@/components/Masthead'
import BlogCard from '@/components/BlogCard'
import Advert from '@/components/Advert'
import Breadcrumbs from '@/components/Breadcrumbs'

import style from '../../blog.module.css'

export default async function Tag({ params }: { params: { tag: string } }) {
    const pages = [{ title: 'Blog', href: '/blog' }]
    return (
        <>
            <Nav />
            <Masthead title="Tag" showExplanation={false} explanation="" />
            <main className={style.main}>
                <Breadcrumbs pages={pages} />
                <div className={style.blogCards}>
                    <Advert />
                </div>
            </main>
            <Footer />
        </>
    )
}
