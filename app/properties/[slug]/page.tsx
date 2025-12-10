import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const options = { next: { revalidate: 30 } }
import PropertyMediaSection from '@/components/PropertyMediaSection'
import styles from "./page.module.css"
import { Play, Images } from "lucide-react"


import { notFound } from 'next/navigation'

import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import PropertyHero from '@/components/PropertyHero'
import FloorplanInformation from '@/components/FloorplanInformation'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import RelatedProperties from '@/components/RelatedProperties'
import StandaloneLink from '@/components/StandaloneLink'

import style from './page.module.css'

import { USDollar } from '@/utils/currency'
import Image from 'next/image'
import VideoPlayer from '@/components/VideoPlayer'
import { useState } from 'react'
import PropertyTimeline from '@/components/PropertyTimeline'
import calculateWeeks from '@/utils/calculateWeeks'

// const PROPERTY_QUERY = `
//     *[_type == "property" && slug.current == $slug][0]{
//     _id,name,location,body,images,bed,bath,sqft,price,download,videoID,floorplan->{name,drawing,floorPlanPDF,download,relatedProperties[]->{name,thumbnail,slug,name,bed,bath,sqft,floorplan->{name,bed,bath,sqft,slug}}}}`

const PROPERTY_QUERY = `*[_type == "property" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  completed,
  featured,

  // ---------------------
  // ADDRESS
  // ---------------------
  address {
    street,
    unit,
    city,
    state,
    zip
  },

  // ---------------------
  // ADU TYPE
  // ---------------------
  aduType,

  // ---------------------
  // FLOORPLAN
  // ---------------------
  floorplan->{
    name,
    bed,
    bath,
    sqft,
    length,
    width,
    price,
    "slug": slug.current,
    drawing,
    download,
    images,
    relatedProperties[]->{
      _id,
      name,
      "slug": slug.current,
      bed,
      bath,
      sqft,
      floorplan->{
        name,
        bed,
        bath,
        sqft,
        "slug": slug.current
      }
    }
  },

  customFloorplan,
  customFloorplanPicture,
  sqft,
  bed,
  bath,

  // ---------------------
  // OPEN HOUSE
  // ---------------------
  openHouse,
  openHouseDates[]{
    day,
    startTime,
    endTime
  },
  openHouseFlyers,

  // ---------------------
  // MEDIA
  // ---------------------
  walkthroughVideo,
  photos,
  hasTestimonial,
  testimonial->{
    _id,
    names,
    quote,
    wistiaId,
    slug,
    portrait,
    body,
    images
 },

  // ---------------------
  // PLANNING & PERMITTING TIMELINES
  // ---------------------
  planningTimeline {
    start,
    end
  },

  permittingTimeline {
    start,
    end
  },

  // ---------------------
  // CONSTRUCTION TIMELINE
  // ---------------------
  constructionTimeline[]{
    week,
    milestone,
    weekImage
  },

  // ---------------------
  // EXTRA SITE WORK
  // ---------------------
  extraSiteWork,

  // ---------------------
  // EXTRA FAQ REFERENCES
  // ---------------------
  extraFaqs[]->{
    _id,
    title,
    body
  },

  // ---------------------
  // CUSTOMER SELECTIONS (OPTIONAL)
  // ---------------------
  customerSelections{
    kitchen->{
      layout,
      countertops,
      backsplash,
      cabinetStyle,
      hardware,
      appliances,
      photos
    },
    bathroom->{
      vanity,
      countertop,
      fixtures,
      tile,
      mirrors,
      lighting,
      photos
    },
    flooring->{
      type,
      color,
      areas,
      photos
    },
    cabinets->{
      style,
      material,
      color,
      hardware,
      photos
    },
    appliances->{
      brand,
      model,
      type,
      photos
    }
  },

  // ---------------------
  // PUBLISH DATE
  // ---------------------
  publishedAt
}
`

export default async function Property({ params,
    setShowGalleryModal,
    galleryImages }) {
    const { slug } = await params

    const property = await client.fetch<SanityDocument>(
        PROPERTY_QUERY,
        { slug },
        options
    )

    const {
        _id,
        name,
        completed,
        featured,

        // Address
        address: {
            street,
            unit,
            city,
            state,
            zip,
        } = {},

        aduType,

        // Floorplan
        floorplan,
        customFloorplan,
        customFloorplanPicture,
        sqft,
        bed,
        bath,

        // Open House
        openHouse,
        openHouseDates = [],
        openHouseFlyers = [],

        // Media
        walkthroughVideo,
        testimonial = {},
        photos = [],

        // Planning & Permitting timelines
        planningTimeline = {},
        permittingTimeline = {},

        // Construction timeline
        constructionTimeline = [],

        // Extra site work / FAQs
        extraSiteWork = [],
        extraFaqs = [],

        // Customer selections
        customerSelections = {},

        publishedAt,
    } = property;
    console.log(property)

    // -----------------------------
    // TIMELINE CALCULATIONS
    // -----------------------------
    const planningWeeks = calculateWeeks(planningTimeline.start, planningTimeline.end);
    const permittingWeeks = calculateWeeks(permittingTimeline.start, permittingTimeline.end);
    const constructionWeeks = constructionTimeline.length;

    return (
        <>
            <Nav />
            <main >
                <PropertyMediaSection property={property} />
                <PropertyTimeline planning={planningWeeks} permitting={permittingWeeks} construction={constructionWeeks} />
            </main>
            <Footer />
        </>
    )
}
