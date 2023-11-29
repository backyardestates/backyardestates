import Layout from '../../src/layouts/Page'

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export default function FloorPlan({ frontmatter }) {
    return (
        <Layout>
            <p>
                <mark>{frontmatter.date}</mark>
            </p>
            <h1>{frontmatter.title}</h1>
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
