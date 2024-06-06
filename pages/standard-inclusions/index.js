import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import TabPanel from '@/components/TabPanel'
import Layout from '@/layouts/Inclusions'
import Tabs from '@/components/Tabs'
import Feature from '@/components/Feature'
// import OpenGraph from '@/components/OpenGraph'
import style from './StandardInclusions.module.css'
import InclusionsPanel from '@/panels/InclusionsPanel'

export default function StandardInclusions({ estates }) {
    const tabs = [
        'Kitchen',
        'Bathroom',
        'Interior features',
        'Exterior features',
        'Construction specifications',
    ]

    return (
        <Layout
            title="Standard inclusions"
            pageTitle="Standard inclusions - Backyard Estates"
            explanation="Vulputate eu scelerisque felis imperdiet proin fermentum leo vel orci porta non pulvinar neque laoreet suspendisse interdum consectetur libero id faucibus"
            floorplans={estates}
        >
            {/* <OpenGraph /> */}
            <InclusionsPanel />
            <div className={style.content}>
                <h2 className={style.headline}>
                    Standard features and upgrades
                </h2>
                <p className={style.sentence}>
                    Any item with an asterisk (*) can be upgraded at an
                    additional cost.
                </p>
                <Tabs tabs={tabs}>
                    <TabPanel>
                        <Feature />
                        <Feature />
                        <Feature />
                        <Feature />
                    </TabPanel>
                    <TabPanel>
                        <Feature />
                        <Feature />
                        <Feature />
                        <Feature />
                    </TabPanel>
                    <TabPanel>
                        <Feature />
                        <Feature />
                        <Feature />
                        <Feature />
                    </TabPanel>
                    <TabPanel>
                        <Feature />
                        <Feature />
                        <Feature />
                        <Feature />
                    </TabPanel>
                    <TabPanel>
                        <Feature />
                        <Feature />
                        <Feature />
                        <Feature />
                    </TabPanel>
                </Tabs>
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
