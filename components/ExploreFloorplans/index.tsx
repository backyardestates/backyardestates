'use client'

import { useState } from 'react'
import { CldImage } from 'next-cloudinary'

import ExploreButtonTags from '../ExploreButtonTags'
import StandaloneLink from '../StandaloneLink'
import VideoPlayer from '../VideoPlayer'
import FloorplanInformation from '@/components/FloorplanInformation'

import style from './ExploreFloorplans.module.css'

export default function ExploreFloorplans({ showNav = false, floorplans }) {
    const [selected, setSelected] = useState(2)
    const [showVideo, setShowVideo] = useState(true)

    // return an object using .find instead of .filter
    let selectedFloorplan = floorplans.find(
        (floorplan) => floorplan.orderID === selected
    )

    return (
        <>
            {showNav && (
                <ExploreButtonTags
                    tags={floorplans}
                    selectedID={selected}
                    setSelected={setSelected}
                />
            )}

            <div className={style.container}>
                <div className={style.columns}>
                    <div className={style.columnLeft}>
                        <h2>{selectedFloorplan.name}</h2>
                        <FloorplanInformation
                            bed={selectedFloorplan.bed}
                            bath={selectedFloorplan.bath}
                            sqft={selectedFloorplan.sqft}
                            price={selectedFloorplan.price}
                            showPrice
                        />
                        {selectedFloorplan.orderID === '1' ||
                        selectedFloorplan.orderID === '2' ||
                        selectedFloorplan.orderID === '3' ? (
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
                                href={`/floorplans/${selectedFloorplan.slug.current}`}
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
                        {!showVideo || selectedFloorplan.videoID === null ? (
                            <CldImage
                                src={selectedFloorplan.drawing.secure_url}
                                width="640"
                                height="360"
                                className={style.img}
                                alt={`3D floor plan image of ${selectedFloorplan.name}`}
                            />
                        ) : (
                            <VideoPlayer wistiaID={selectedFloorplan.videoID} />
                        )}
                    </div>
                </div>

                {selectedFloorplan.videoID !== null && (
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
