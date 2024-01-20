import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Image from 'next/image'

import CustomerStory from '@/components/CustomerStory'
import Layout from '../../src/layouts/Floorplan'
import PropertyInformation from '@/components/PropertyInformation'
import RelatedContent from '@/components/RelatedContent'
import StandaloneLink from '@/components/StandaloneLink'
import VideoPlayer from '@/components/VideoPlayer'

import style from './FloorPlan.module.css'

export default function FloorPlan({ floorplan, estates }) {
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
                <PropertyInformation floorplan={floorplan} />
                <div className={style.price}>
                    {price !== null && (
                        <h3 className={style.subhead}>
                            all-in-price starts at
                        </h3>
                    )}

                    {price !== null && (
                        <p className={style.price}>{`$${price}`}</p>
                    )}
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
                <div className={style.videoAndImage}>
                    {floorplan.floorPlanImage !== null && (
                        <Image
                            src={`/images/floor-plans/${floorplan.floorPlanImage}`}
                            alt={`3D floor plan image of ${floorplan.title}`}
                            width={640}
                            height={360}
                            className={style.image}
                            style={{ flex: 1 }}
                            priority
                        />
                    )}
                    {wistiaID !== null && (
                        <VideoPlayer
                            wistiaID={wistiaID}
                            className={style.video}
                            style={{ flex: 1 }}
                        />
                    )}
                </div>
            </div>
            <CustomerStory story={floorplan} hideDetails>
                <h2 style={{ textAlign: 'left' }}>Every estate includes:</h2>
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
                    <li>Smart ceiling fans</li>
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

    const { data: floorplan } = matter(markdownWithMeta)

    return {
        props: {
            floorplan,
            estates,
        },
    }
}
