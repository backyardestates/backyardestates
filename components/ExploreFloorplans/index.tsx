'use client'
import { useState } from 'react'
import Image from 'next/image'

import ButtonTags from '../ButtonTags'
import StandaloneLink from '../StandaloneLink'
import VideoPlayer from '../VideoPlayer'
import PropertyInformation from '../PropertyInformation'

import style from './ExploreFloorplans.module.css'

export default function ExploreFloorplans({ showNav = false, floorplans }) {
    const [selected, setSelected] = useState(2)
    const [showVideo, setShowVideo] = useState(true)

    // return an object using .find instead of .filter
    let selectedFloorplan = floorplans.find(
        (floorplan) => floorplan.id === selected
    )

    return (
        <>
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
                        <h2>{selectedFloorplan.title}</h2>
                        <PropertyInformation
                            floorplan={selectedFloorplan}
                            showPrice
                        />
                        {selectedFloorplan.id === '350-000' ||
                        selectedFloorplan.id === '400-000' ||
                        selectedFloorplan.id === '450-000' ? (
                            <p>
                                Inclusions: Discover our modern open floorplan,
                                designed for optimal use of every square foot.
                                Our all-inclusive price covers everything from
                                architectural, structural, and title 24 plans,
                                permit running, standard city fees, and
                                construction with utility connection
                                (50&prime;). Revel in the luxury of stainless
                                steel kitchen appliances, quartz countertops,
                                and LVP throughout. Your dream home will be
                                thoughtfully crafted for style and convenience.
                            </p>
                        ) : (
                            <p>
                                Inclusions: Discover our modern open floorplan,
                                designed for optimal use of every square foot.
                                Our all-inclusive price covers everything from
                                architectural, structural, and title 24 plans,
                                permit running, standard city fees, construction
                                with utility connection (50&prime;), and solar.
                                Revel in the luxury of stainless steel kitchen
                                appliances, quartz countertops, and LVP
                                throughout. Your dream home will be thoughtfully
                                crafted for style and convenience.
                            </p>
                        )}
                        <div className={style.linkGroup}>
                            <StandaloneLink
                                theme="beige"
                                href={`/gallery/${selectedFloorplan.floorplan}`}
                            >
                                View floor plan
                            </StandaloneLink>
                            <StandaloneLink
                                href="/standard-inclusions"
                                theme="beige"
                            >
                                View standard inclusions
                            </StandaloneLink>
                        </div>
                    </div>
                    <div className={style.columnRight}>
                        {!showVideo || selectedFloorplan.wistiaID === null ? (
                            <Image
                                src={`/images/floor-plans/${selectedFloorplan.floorPlanImage}`}
                                alt={`3D floor plan image of ${selectedFloorplan.title}`}
                                width={640}
                                height={360}
                                className={style.img}
                            />
                        ) : (
                            <VideoPlayer
                                wistiaID={selectedFloorplan.wistiaID}
                                // style={
                                //     showVideo
                                //         ? { display: 'block' }
                                //         : { display: 'none' }
                                // }
                            />
                        )}
                    </div>
                </div>

                {selectedFloorplan.wistiaID !== null && (
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
            </div>
        </>
    )
}
