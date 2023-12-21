import { useState } from 'react'

import Image from 'next/image'
import SectionTitle from '@/components/SectionTitle'
import StandaloneLink from '@/components/StandaloneLink'
// import Divider from '@/components/Divider'

import style from './Floorplans.module.css'
import Button from '../Button'
import VideoPlayer from '../VideoPlayer'
import PropertyInformation from '../PropertyInformation'
// import ButtonTag from '../ButtonTag'
import ButtonTags from '../ButtonTags'

export default function Floorplans({ showNav = false, floorplans }) {
    const [selected, setSelected] = useState(1)
    const [showVideo, setShowVideo] = useState(true)

    let selectedFloorplan = floorplans[selected]
    return (
        <div className={style.base}>
            <SectionTitle
                title="Explore our floor plans"
                explanation="Any floor plan can be customized to meet your adu needs"
            />
            <div className={style.content}>
                {showNav && (
                    <ButtonTags
                        tags={floorplans}
                        selectedID={selected}
                        setSelected={setSelected}
                    />
                )}

                <div className={style.container}>
                    <div className={style.columns}>
                        <div className={style.columnLeft}>
                            <h2>{selectedFloorplan.frontmatter.title}</h2>
                            <PropertyInformation
                                floorplan={selectedFloorplan.frontmatter}
                            />
                            <p>
                                Interdum velit euismod in pellentesque massa
                                placerat duis ultricies lacus sed turpis
                                tincidunt id aliquet risus feugiat in ante metus
                                dictum at tempor commodo ullamcorper a lacus
                                vestibulum sed arcu
                            </p>
                            <StandaloneLink
                                theme="beige"
                                href={`/floor-plans/${selectedFloorplan.slug}`}
                            >
                                View floor plan
                            </StandaloneLink>
                        </div>
                        <div className={style.columnRight}>
                            {!showVideo && (
                                <Image
                                    src="/images/fpo-video.png"
                                    alt="Placeholder"
                                    width={640}
                                    height={360}
                                    className={style.img}
                                />
                            )}
                            {showVideo && (
                                <VideoPlayer
                                    style={
                                        showVideo
                                            ? { display: 'block' }
                                            : { display: 'none' }
                                    }
                                />
                            )}
                        </div>
                    </div>
                    <div className={style.buttonGroup}>
                        <button
                            className={
                                showVideo
                                    ? style.buttonGroupButtonLeft_selected
                                    : style.buttonGroupButtonLeft
                            }
                            onClick={() => setShowVideo(!showVideo)}
                        >
                            Walkthrough
                        </button>
                        <button
                            className={
                                showVideo
                                    ? style.buttonGroupButtonRight
                                    : style.buttonGroupButtonRight_selected
                            }
                            onClick={() => setShowVideo(!showVideo)}
                        >
                            Floor plan
                        </button>
                    </div>
                </div>
            </div>
            <div className={style.centered}>
                <Button href="/talk-to-an-adu-specialist" theme="beige">
                    Talk to an ADU specialist
                </Button>
            </div>
        </div>
    )
}
