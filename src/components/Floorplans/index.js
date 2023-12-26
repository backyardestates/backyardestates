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
import ButtonGroup from '../ButtonGroup'

export default function Floorplans({ showNav = false, floorplans }) {
    const [selected, setSelected] = useState(1)
    const [showVideo, setShowVideo] = useState(true)

    let selectedFloorplan = floorplans[selected]
    // console.log(selectedFloorplan)
    return (
        <div className={style.base}>
            <div className={style.content}>
                <SectionTitle
                    title="Explore our floor plans"
                    explanation="Any floor plan can be customized to meet your adu needs"
                />
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
                                <mark>
                                    Interdum velit euismod in pellentesque massa
                                    placerat duis ultricies lacus sed turpis
                                    tincidunt id aliquet risus feugiat in ante
                                    metus dictum at tempor commodo ullamcorper a
                                    lacus vestibulum sed arcu
                                </mark>
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
                                    href={`/floor-plans/${selectedFloorplan.slug}`}
                                    src={`/images/floor-plans/${selectedFloorplan.frontmatter.floorPlanImage}`}
                                    alt="Placeholder"
                                    width={640}
                                    height={360}
                                    className={style.img}
                                />
                            )}
                            {showVideo &&
                                selectedFloorplan.frontmatter.wistiaID ===
                                    null && (
                                    <Image
                                        href={`/floor-plans/${selectedFloorplan.slug}`}
                                        src={`/images/floor-plans/${selectedFloorplan.frontmatter.floorPlanVideo}`}
                                        alt="Placeholder"
                                        width={640}
                                        height={360}
                                        className={style.img}
                                    />
                                )}
                            {showVideo &&
                                selectedFloorplan.frontmatter.wistiaID !==
                                    null && (
                                    <VideoPlayer
                                        wistiaID={
                                            selectedFloorplan.frontmatter
                                                .wistiaID
                                        }
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
                    {/* <ButtonGroup /> */}
                </div>
            </div>
            <div className={style.bg}>
                <Image
                    src="/greater-los-angeles.svg"
                    alt="Accessory Dwelling Unit (ADU)"
                    fill
                    sizes="100vw"
                    style={{
                        objectFit: 'cover',
                        objectPosition: 'center center',
                        opacity: 0.15,
                    }}
                />
            </div>
        </div>
    )
}
