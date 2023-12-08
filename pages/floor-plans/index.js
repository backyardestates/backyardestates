import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Link from 'next/link'
import Layout from '../../src/layouts/Page'
import style from './FloorPlans.module.css'
import Tag from '@/components/Tag'
import Card from '@/components/Card'
import Property from '@/components/Property'

import { useState } from 'react'

export default function FloorPlans({ estates }) {
    const [selectedProperty, setSelectedProperty] = useState('Z')

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

    // var selectedProperty = 'Z'

    var selectedProperties = estates.filter((estate) => {
        if (selectedProperty === 'Z') {
            return estates
        } else {
            return estate.frontmatter.order === selectedProperty
        }
    })

    // console.log(selectedProperties)

    return (
        <Layout
            title="Floor plans"
            explanation="Browse our floor plans and customer stories to discover the right Accessory Dwelling Unit (ADU) for your family"
        >
            <div className={style.content}>
                <ul className={style.tags}>
                    {estates.map((estate, index) => (
                        <li key={index}>
                            <button
                                className={style.tag}
                                onClick={() =>
                                    setSelectedProperty(
                                        estate.frontmatter.order
                                    )
                                }
                            >
                                {estate.frontmatter.title}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            onClick={() => setSelectedProperty('Z')}
                            className={
                                selectedProperty === 'Z'
                                    ? style.clear_filter_hidden
                                    : style.clear_filter_show
                            }
                        >
                            Clear filters
                        </button>
                    </li>
                </ul>
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
