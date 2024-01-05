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

export default function FloorPlan({ floorplan, content, estates }) {
    const title = floorplan.title
    const price = floorplan.price
    const wistiaID = floorplan.wistiaID
    const floorPlanPDF = floorplan.floorPlanPDF
    const relatedProperties = floorplan.related

    const filteredRelatedProperties = estates.filter((e) =>
        relatedProperties.includes(e.frontmatter.id)
    )

    return (
        <Layout pageTitle={title} floorplans={estates}>
            <div className={style.content}>
                <h1>{title}</h1>
                <p className={style.intro}>
                    Explore our modern open floorplan, beautifully designed to
                    optimize every square footage with high-quality standard
                    finishes and kitchen appliances, offering a move-in-ready
                    solution for a contemporary lifestyle.
                </p>
                <PropertyInformation floorplan={floorplan} />
                <div className={style.price}>
                    <h3 className={style.subhead}>all-in-price starts at</h3>
                    <p className={style.price}>{`$${price}`}</p>
                    {floorPlanPDF !== null && (
                        <StandaloneLink
                            icon="download"
                            href={`/pdf/${floorPlanPDF}`}
                            download
                        >
                            Download floor plan
                        </StandaloneLink>
                    )}
                </div>

                {wistiaID !== null && <VideoPlayer wistiaID={wistiaID} />}
            </div>
            <CustomerStory story={floorplan} hideDetails>
                {/* <Markdown>{content}</Markdown> */}
                <p>
                    <strong>Every estate includes:</strong>
                </p>
                <ul>
                    <li>Luxury vinyl planking</li>
                    <li>Name brand stainless-steel kitchen appliances</li>
                    <li>Real quartz countertops</li>
                    <li>Recessed lighting in every room</li>
                    <li>
                        Clerestory windows with vaulted ceilings in kitchen and
                        living room
                    </li>
                    <li>2-inch vinyl blinds on windows</li>
                    <li>Mirrored closet doors in bedrooms</li>
                </ul>
            </CustomerStory>
            <RelatedContent properties={filteredRelatedProperties} />
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
