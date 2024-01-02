import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Layout from '../../src/layouts/Page'
import style from './ContactUs.module.css'
export default function ContactUs({ estates }) {
    return (
        <Layout
            title="Contact us"
            pageTitle="Contact us - Backyard Estates"
            explanation="Aliquet risus feugiat in ante metus dictum at tempor commodo ullamcorper a lacus vestibulum sed arcu non odio euismod lacinia at quis risus sed vulputate odio."
            floorplans={estates}
        >
            <div className={style.content}>Placeholder for content</div>
        </Layout>
    )
}

export async function getStaticProps() {
    // console.log(`files:`)
    const files = fs.readdirSync(path.join('data'))
    // console.log(`files: ${files}`)

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
