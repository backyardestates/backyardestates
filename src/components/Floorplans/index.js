import { useState } from 'react'

import Image from 'next/image'
import SectionTitle from '@/components/SectionTitle'
import StandaloneLink from '@/components/StandaloneLink'
// import Divider from '@/components/Divider'

import style from './Floorplans.module.css'
// import Button from '../Button'
import VideoPlayer from '../VideoPlayer'
import PropertyInformation from '../PropertyInformation'
// import ButtonTag from '../ButtonTag'
import ButtonTags from '../ButtonTags'
// import ButtonGroup from '../ButtonGroup'

export default function Floorplans({ showNav = false, floorplans }) {
    const [selected, setSelected] = useState(1)
    const [showVideo, setShowVideo] = useState(true)

    // filter properties for floor plans
    const filteredProperties = floorplans.filter(
        (property) => property.frontmatter.isFloorplan
    )

    let selectedFloorplan = filteredProperties[selected]
    return (
        <div className={style.base}>
            <div className={style.content}>
                <SectionTitle
                    title="Explore our floor plans"
                    explanation="We offer customized ADU floorplans to accomodate your family's needs."
                />

                {showNav && (
                    <ButtonTags
                        tags={filteredProperties}
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
                                showPrice
                            />
                            <p>
                                Explore our modern open floorplan, beautifully
                                designed to optimize every square footage with
                                high-quality standard finishes and kitchen
                                appliances, offering a move-in-ready solution
                                for a contemporary lifestyle.
                            </p>
                            <StandaloneLink
                                theme="beige"
                                href={`/floor-plans/${selectedFloorplan.slug}`}
                            >
                                View floor plan
                            </StandaloneLink>
                        </div>
                        <div className={style.columnRight}>
                            {!showVideo ||
                            selectedFloorplan.frontmatter.wistiaID === null ? (
                                <Image
                                    href={`/floor-plans/${selectedFloorplan.slug}`}
                                    src={`/images/floor-plans/${selectedFloorplan.frontmatter.floorPlanImage}`}
                                    alt="Placeholder"
                                    width={640}
                                    height={360}
                                    className={style.img}
                                />
                            ) : (
                                <VideoPlayer
                                    wistiaID={
                                        selectedFloorplan.frontmatter.wistiaID
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

                    {selectedFloorplan.frontmatter.wistiaID !== null && (
                        <div className={style.buttonGroup}>
                            <button
                                className={
                                    showVideo
                                        ? style.buttonGroupButtonLeft_selected
                                        : style.buttonGroupButtonLeft
                                }
                                onClick={() => setShowVideo(!showVideo)}
                            >
                                Video
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
                    )}

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
