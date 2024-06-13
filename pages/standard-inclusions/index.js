import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import TabPanel from '@/components/TabPanel'
import Layout from '@/layouts/Inclusions'
import Tabs from '@/components/Tabs'
import Feature from '@/components/Feature'
// import OpenGraph from '@/components/OpenGraph'
import style from './StandardInclusions.module.css'
import { ROOMS } from '../../content/inclusions'

export default function StandardInclusions({ estates }) {
    return (
        <Layout
            title="Standard inclusions"
            pageTitle="Standard inclusions - Backyard Estates"
            explanation="At Backyard Estates, we provide complete transparency on the exact inclusions of our standard ADU builds"
            floorplans={estates}
        >
            {/* <OpenGraph /> */}
            <div className={style.content}>
                <h2 className={style.headline}>
                    Standard features and upgrades
                </h2>
                <p className={style.sentence}>
                    Any item with an asterisk (*) can be upgraded at an
                    additional cost.
                </p>
                <Tabs tabs={ROOMS} />
            </div>
        </Layout>
    )
}

export async function getStaticProps() {
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
    return { props: { estates } }
}
