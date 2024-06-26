import { useState } from 'react'
import Image from 'next/image'
import SectionTitle from '@/components/SectionTitle'
import StandaloneLink from '@/components/StandaloneLink'
import TabBar from '@/components/TabBar'

import style from './Floorplans.module.css'
import VideoPlayer from '../VideoPlayer'
import PropertyInformation from '../PropertyInformation'
import ButtonTags from '../ButtonTags'
import InclusionsHomePanel from '@/panels/InclusionsHomePanel'

// import { useState,  } from 'react'
// import { PreviewContext } from '@/panels/InclusionsPanel'

export default function Floorplans({ showNav = false, floorplans }) {
    const [selected, setSelected] = useState(2)
    const [showVideo, setShowVideo] = useState(true)

    // const { preview, setPreview } = useContext(PreviewContext)

    // filter properties for floor plans
    const filteredProperties = floorplans.filter(
        (property) => property.frontmatter.isFloorplan
    )

    let selectedFloorplan = filteredProperties[selected]
    return (
        <div className={style.base}>
            <div className={style.content}>
                <SectionTitle
                    title="Choose a floor plan"
                    // explanation="We offer customized ADU floorplans to accomodate your family's needs."
                    explanation=""
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
                            {selectedFloorplan.frontmatter.id === '350-000' ||
                            selectedFloorplan.frontmatter.id === '400-000' ||
                            selectedFloorplan.frontmatter.id === '450-000' ? (
                                <p>
                                    Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit, sed do eiusmod tempor
                                    incididunt ut labore et dolore magna aliqua.
                                    Placerat vestibulum lectus mauris ultrices
                                    eros in cursus turpis massa.
                                </p>
                            ) : (
                                <p>
                                    Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit, sed do eiusmod tempor
                                    incididunt ut labore et dolore magna aliqua.
                                    Placerat vestibulum lectus mauris ultrices
                                    eros in cursus turpis massa.
                                </p>
                            )}
                            <div className={style.links}>
                                <StandaloneLink
                                    theme="beige"
                                    href={`/gallery/${selectedFloorplan.slug}`}
                                >
                                    View floor plan
                                </StandaloneLink>
                                <StandaloneLink
                                    theme="beige"
                                    href={`/standard-inclusions`}
                                >
                                    View standard inclusions
                                </StandaloneLink>
                            </div>
                        </div>
                        <div className={style.columnRight}>
                            {!showVideo ||
                            selectedFloorplan.frontmatter.wistiaID === null ? (
                                <div className={style.interiors}>
                                    <Image
                                        src={`/images/floor-plans/${selectedFloorplan.frontmatter.floorPlanImage}`}
                                        alt={`3D floor plan image of ${selectedFloorplan.frontmatter.title}`}
                                        width={640}
                                        height={360}
                                        className={style.img}
                                    />
                                    <a onClick={() => setShowVideo(!showVideo)}>
                                        View video
                                    </a>
                                </div>
                            ) : (
                                <div className={style.interiors}>
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
                                    <a onClick={() => setShowVideo(!showVideo)}>
                                        View image
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={style.collectionsContainer}>
                    <SectionTitle
                        title="Choose a package or customize"
                        // explanation="We provide complete transparency on the exact inclusions of our standard and custom ADU builds"
                        explanation=""
                    />
                    <InclusionsHomePanel />

                    <StandaloneLink theme="beige" href={`/standard-inclusions`}>
                        View standard inclusions
                    </StandaloneLink>
                </div>
            </div>
            {/* <div className={style.bg}>
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
            </div> */}
        </div>
    )
}
