import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../src/layouts/Homepage'
import Testimonials from '@/components/Testimonials'
import Properties from '@/components/Properties'
import Benefits from '@/components/Benefits'
import Process from '@/components/Process'
import Floorplans from '@/components/Floorplans'
import OpenGraph from '@/components/OpenGraph'

export default function Home({ estates }) {
    estates.sort((a, b) => {
        const nameA = a.frontmatter.order
        const nameB = b.frontmatter.order
        if (nameA < nameB) {
            return -1
        }
        if (nameA > nameB) {
            return 1
        }
        return 0
    })
    return (
        <Layout floorplans={estates}>
            <OpenGraph />
            <Testimonials />
            <Floorplans showNav={true} floorplans={estates} />
            <Benefits />
            <Process />
            <Properties data={estates} />
        </Layout>
    )
}

export async function getStaticProps() {
    const files = fs.readdirSync(path.join('data'))
    // console.log(files)

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
