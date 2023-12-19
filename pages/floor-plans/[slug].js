import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../../src/layouts/Floorplan'
import StandaloneLink from '@/components/StandaloneLink'
import style from './FloorPlan.module.css'
import Divider from '@/components/Divider'

// import Floorplans from '@/components/Floorplans'
import VideoPlayer from '@/components/VideoPlayer'
import CustomerStory from '@/components/CustomerStory'

export default function FloorPlan({ frontmatter }) {
    const title = frontmatter.title
    const bed = frontmatter.bed
    const bath = frontmatter.bath
    const sqft = frontmatter.sqft
    const price = frontmatter.price

    return (
        <Layout>
            <div className={style.content}>
                <h1>{title}</h1>
                <p className={style.intro}>
                    This modern open floor plan with one bedroom is perfect for
                    family members or rental income
                </p>

                <ul className={style.information}>
                    <li>{bed === 'Studio' ? `${bed}` : `${bed} Bed`}</li>
                    <li>
                        <Divider />
                    </li>
                    <li>{`${bath} Bath`}</li>
                    <li>
                        <Divider />
                    </li>
                    <li>{`${sqft} sq. ft.`}</li>
                </ul>

                <h3 className={style.subhead}>all-in-price starts at</h3>
                <p className={style.price}>{`$${price}`}</p>
                <StandaloneLink icon="download">
                    Download floor plan
                </StandaloneLink>
            </div>
            <VideoPlayer />
            <CustomerStory />
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

    const { data: frontmatter, content } = matter(markdownWithMeta)

    // console.log(frontmatter)

    return {
        props: {
            frontmatter,
        },
    }
}
