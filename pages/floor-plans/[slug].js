import Layout from '../../src/layouts/Floorplan'
import StandaloneLink from '@/components/StandaloneLink'
import style from './FloorPlan.module.css'

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

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
                <p>
                    This modern open floor plan with one bedroom is perfect for
                    family members or rental income
                </p>
                <ul className={style.information}>
                    <li>{`${bed} Bed`}</li>
                    <li>{`${bath} Bath`}</li>
                    <li>{`${sqft} sq. ft.`}</li>
                </ul>
                <h3>all-in-price starts at</h3>
                <p>{`$${price}`}</p>
                <StandaloneLink>Download floor plan</StandaloneLink>
            </div>
            <div className={style.content}>Video placeholder</div>
            <div className={style.content}>Customer story placeholder</div>
            <div className={style.content}>Take a look inside placeholder</div>
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
