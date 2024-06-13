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
        // 'Interior features',
        // 'Exterior features',
        // 'Construction specifications',
    ]

    const kitchen = [
        {
            image: 'featureFPO.png',
            header: 'Cabinets',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        {
            image: 'featureFPO.png',
            header: 'Counter tops',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        {
            image: 'featureFPO.png',
            header: 'Appliances',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
    ]

    const bathroom = [
        {
            image: 'featureFPO.png',
            header: 'Shower',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        {
            image: 'featureFPO.png',
            header: 'Shower head',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
    ]

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
                <Tabs tabs={tabs}>
                    <TabPanel>
                        {kitchen.map((feature, index) => (
                            <Feature key={index} content={feature} />
                        ))}
                    </TabPanel>
                    <TabPanel>
                        {bathroom.map((feature, index) => (
                            <Feature key={index} content={feature} />
                        ))}
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
