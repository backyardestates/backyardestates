import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../../src/layouts/Page'
import style from './FloorPlans.module.css'
import Card from '@/components/Card'

import { useState } from 'react'
import ButtonTags from '@/components/ButtonTags'

export default function FloorPlans({ estates }) {
    const [selected, setSelected] = useState(99)

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

    var selectedProperties = estates.filter((estate) => {
        switch (selected) {
            case 0:
                return estate.frontmatter.order === 'A'
            case 1:
                return estate.frontmatter.order === 'B'
            case 2:
                return estate.frontmatter.order === 'C'
            case 3:
                return estate.frontmatter.order === 'D'
            case 4:
                return estate.frontmatter.order === 'E'
            case 5:
                return estate.frontmatter.order === 'F'
            case 6:
                return estate.frontmatter.order === 'G'
            case 7:
                return estate.frontmatter.order === 'H'
            default:
                return estates
        }
    })
    return (
        <Layout
            title="Floor plans"
            explanation="Browse our floor plans and customer stories to discover the right Accessory Dwelling Unit (ADU) for your family"
        >
            <div className={style.content}>
                <ButtonTags
                    tags={estates}
                    selectedID={selected}
                    setSelected={setSelected}
                    showAll={true}
                />
                <ul className={style.cards}>
                    {selectedProperties.map((estate, index) => (
                        <li key={index}>
                            <Card estate={estate} />
                        </li>
                    ))}
                </ul>
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
