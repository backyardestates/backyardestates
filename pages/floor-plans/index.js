import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Link from 'next/link'
import Layout from '../../src/layouts/Page'

export default function FloorPlans({ estates }) {
    // console.log(estates)
    return (
        <Layout>
            <h1>Floor plans</h1>
            <ul>
                {estates.map((estate, index) => (
                    <li key={index}>
                        <Link href={`/floor-plans/${estate.slug}`}>
                            {estate.frontmatter.title}
                        </Link>
                    </li>
                ))}
            </ul>
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
    // console.log(estates)
    return { props: { estates } }
}
