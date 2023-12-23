import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../../src/layouts/Floorplan'
import StandaloneLink from '@/components/StandaloneLink'
import VideoPlayer from '@/components/VideoPlayer'
import CustomerStory from '@/components/CustomerStory'
import PropertyInformation from '@/components/PropertyInformation'

import style from './FloorPlan.module.css'

export default function FloorPlan({ floorplan }) {
    const title = floorplan.title
    const price = floorplan.price

    return (
        <Layout pageTitle={title}>
            <div className={style.content}>
                <h1>{title}</h1>
                {/* <p className={style.intro}>
                    This modern open floor plan with one bedroom is perfect for
                    family members or rental income
                </p> */}
                <PropertyInformation floorplan={floorplan} />
                <h3 className={style.subhead}>all-in-price starts at</h3>
                <p className={style.price}>{`$${price}`}</p>
                <StandaloneLink icon="download">
                    Download floor plan
                </StandaloneLink>
                <VideoPlayer />
            </div>
            <CustomerStory story={floorplan} />
        </Layout>
    )
}

export async function getStaticPaths() {
    const files = fs.readdirSync(path.join('data'))

    const paths = files.map((filename) => ({
        params: {
            slug: filename.replace('.md', ''),
        },
    }))

    // console.log(paths)

    return {
        paths,
        fallback: false,
    }
}

export async function getStaticProps({ params: { slug } }) {
    const markdownWithMeta = fs.readFileSync(
        path.join('data', slug + '.md'),
        'utf-8'
    )

    // console.log(markdownWithMeta)

    const { data: floorplan, content } = matter(markdownWithMeta)

    // console.log(frontmatter)

    return {
        props: {
            floorplan,
        },
    }
}
