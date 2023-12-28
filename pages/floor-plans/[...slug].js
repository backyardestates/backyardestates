import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../../src/layouts/Floorplan'
import StandaloneLink from '@/components/StandaloneLink'
import VideoPlayer from '@/components/VideoPlayer'
import CustomerStory from '@/components/CustomerStory'
import PropertyInformation from '@/components/PropertyInformation'
import Markdown from 'react-markdown'

import style from './FloorPlan.module.css'
import RelatedContent from '@/components/RelatedContent'

export default function FloorPlan({ floorplan, content }) {
    const title = floorplan.title
    const price = floorplan.price
    const wistiaID = floorplan.wistiaID
    const relatedProperties = floorplan.related

    return (
        <Layout pageTitle={title}>
            <div className={style.content}>
                <h1>{title}</h1>
                <p className={style.intro}>
                    <mark>
                        Interdum velit euismod in pellentesque massa placerat
                        duis ultricies lacus sed turpis tincidunt id aliquet
                        risus feugiat in ante metus dictum at tempor commodo
                    </mark>
                </p>
                <PropertyInformation floorplan={floorplan} />
                <h3 className={style.subhead}>all-in-price starts at</h3>
                <p className={style.price}>{`$${price}`}</p>
                <StandaloneLink icon="download">
                    Download floor plan
                </StandaloneLink>
                {wistiaID !== null && <VideoPlayer wistiaID={wistiaID} />}
            </div>
            <CustomerStory story={floorplan} hideDetails>
                <Markdown>{content}</Markdown>
            </CustomerStory>
            <RelatedContent properties={relatedProperties} />
        </Layout>
    )
}

export async function getStaticPaths() {
    const files = fs.readdirSync(path.join('data'))
    const paths = files.map((filename) => {
        const name = path.parse(filename).name
        const slugArray = name.split(',')
        return { params: { slug: slugArray } }
    })

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

    const markdownWithMeta = fs.readFileSync(
        path.join('data', slug + '.md'),
        'utf-8'
    )

    const { data: floorplan, content } = matter(markdownWithMeta)

    return {
        props: {
            floorplan,
            content,
            estates,
        },
    }
}
