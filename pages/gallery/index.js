import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../../src/layouts/Page'
import style from './FloorPlans.module.css'
import Card from '@/components/Card'

import { useState } from 'react'
import ButtonTags from '@/components/FilterTags'
import OpenGraph from '@/components/OpenGraph'

export default function FloorPlans({ estates }) {
    const [selected, setSelected] = useState(99)

    // filter properties for floor plans
    // const filteredProperties = estates.filter(
    //     (property) => property.frontmatter.isFloorplan
    // )

    const bedroomCounts = ['Studio', '1 bedroom', '2 bedrooms', '3 bedrooms']

    // filteredProperties.sort((a, b) => {
    //     const nameA = a.frontmatter.order
    //     const nameB = b.frontmatter.order
    //     if (nameA < nameB) {
    //         return -1
    //     }
    //     if (nameA > nameB) {
    //         return 1
    //     }
    //     return 0
    // })

    var selectedProperties = estates.filter((estate) => {
        switch (selected) {
            case 0:
                return estate.frontmatter.bed === 'Studio'
            case 1:
                return estate.frontmatter.bed === 1
            case 2:
                return estate.frontmatter.bed === 2
            case 3:
                return estate.frontmatter.bed === 3
            default:
                return estates
        }
    })

    selectedProperties.sort((a, b) => {
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
        <Layout
            title="Gallery"
            pageTitle="Gallery - Backyard Estates"
            explanation="Browse recent projects and customer stories to discover the right Accessory Dwelling Unit (ADU) for your family"
            floorplans={estates}
        >
            <OpenGraph />
            <div className={style.content}>
                <ButtonTags
                    tags={bedroomCounts}
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
