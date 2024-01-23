import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../../src/layouts/CustomerStoryLayout'
import PropertyInformation from '@/components/PropertyInformation'
import VideoPlayer from '@/components/VideoPlayer'
import CustomerStory from '@/components/CustomerStory'
import RelatedContent from '@/components/RelatedContent'

import style from './CustomerStoryTemplate.module.css'

import Markdown from 'react-markdown'
import OpenGraph from '@/components/OpenGraph'

export default function CustomerStoryTemplate({ story, content, estates }) {
    const name = story.name
    const title = story.title
    const price = story.price
    const introductorySentence = story.intro
    const video = story.wistiaID

    const relatedProperties = story.related
    const filteredRelatedProperties = estates.filter((e) =>
        relatedProperties.includes(e.frontmatter.id)
    )

    return (
        <Layout pageTitle={name} floorplans={estates}>
            <OpenGraph title={`Backyard Estates - ${name}'s customer story`} />
            <div className={style.content}>
                <h1>{name}</h1>
                <p className={style.intro}>{introductorySentence}</p>
                <h2>{title}</h2>
                <PropertyInformation floorplan={story} />
                <VideoPlayer wistiaID={video} />
            </div>
            <CustomerStory story={story}>
                <Markdown>{content}</Markdown>
            </CustomerStory>
            <RelatedContent properties={filteredRelatedProperties} />
        </Layout>
    )
}

export async function getStaticPaths() {
    const files = fs.readdirSync(path.join('customers'))

    const paths = files.map((filename) => ({
        params: {
            slug: filename.replace('.md', ''),
        },
    }))

    return {
        paths,
        fallback: false,
    }
}

export async function getStaticProps({ params: { slug } }) {
    const files = fs.readdirSync(path.join('data'))

    const estates = files.map((filename) => {
        const slug = filename.replace('.md', '')
        const markdown = fs.readFileSync(path.join('data', filename), 'utf-8')
        const { data: frontmatter } = matter(markdown)
        return {
            slug,
            frontmatter,
        }
    })
    // return { props: { estates } }

    const markdownWithMeta = fs.readFileSync(
        path.join('customers', slug + '.md'),
        'utf-8'
    )

    const { data: story, content } = matter(markdownWithMeta)

    return {
        props: {
            story,
            content,
            estates,
        },
    }
}
