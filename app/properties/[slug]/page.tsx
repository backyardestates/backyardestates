import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const options = { next: { revalidate: 30 } }
import PropertyMediaSection from '@/components/PropertyMediaSection'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import PropertyTimeline from '@/components/PropertyTimeline'
import calculateWeeks from '@/utils/calculateWeeks'
import TestimonialDisplay from '@/components/TestimonialDisplay'
import ScrollingBanner from '@/components/ScrollingBanner'
import ConstructionTimeline from '@/components/ConstructionTimeline'
import OpenHouseFloorplans from '@/components/OpenHouseFloorplans'
import SelectionsGallery from '@/components/SelectionsGallery'
import { groupSelections } from '@/lib/groupSelections'
import styles from './page.module.css'
import SoftCTA from '@/components/SoftCTA'
import AttentionCTA from '@/components/AttentionCTA'
import RelatedProperties from '@/components/RelatedProperties'
import { PROPERTY_QUERY, RELATED_PROPERTIES_QUERY } from '@/sanity/queries'
import LegacyPropertiesPage from '@/components/LegacyPropertiesPage'

export default async function Property({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const property = await client.fetch<SanityDocument>(
    PROPERTY_QUERY,
    { slug },
    options
  )

  const relatedProperties = await client.fetch<SanityDocument[]>(
    RELATED_PROPERTIES_QUERY,
    { slug },
    options
  )

  if (!property.photos) {
    return <LegacyPropertiesPage params={slug} />
  }

  const {
    // _id,
    // name,
    // completed,
    // featured,

    // // Address
    // address: {
    //   street,
    //   unit,
    //   city,
    //   state,
    //   zip,
    // } = {},

    // aduType,

    // Floorplan
    floorplan,
    // customFloorplan,
    customFloorplanPicture,
    sqft,
    bed,
    bath,

    // Open House
    // openHouse,
    // openHouseDates = [],
    // openHouseFlyers = [],

    // Media
    // walkthroughVideo,
    testimonial,
    // photos = [],

    // Planning & Permitting timelines
    planningTimeline = {},
    permittingTimeline = {},

    // Construction timeline
    constructionTimeline = [],

    // Extra site work / FAQs
    // extraSiteWork = [],
    // extraFaqs = [],

    // Customer selections
    selections = [],

    // publishedAt,
  } = property;


  // -----------------------------
  // TIMELINE CALCULATIONS
  // -----------------------------
  const planningWeeks = calculateWeeks(planningTimeline.start, planningTimeline.end);
  const permittingWeeks = calculateWeeks(permittingTimeline.start, permittingTimeline.end);
  const constructionWeeks = constructionTimeline.length;
  let groupedSelections;
  if (selections) {
    groupedSelections = groupSelections(selections);
  }

  return property ? (
    <>
      <Nav />
      <main >
        <PropertyMediaSection property={property} />

        {testimonial && (
          <TestimonialDisplay testimonial={testimonial} />
        )}
        <ScrollingBanner />
        <PropertyTimeline planning={planningWeeks} permitting={permittingWeeks} construction={constructionWeeks} />
        {constructionTimeline && constructionTimeline[0].weekImage && (
          <ConstructionTimeline timeline={constructionTimeline} />
        )}
        <OpenHouseFloorplans floorplan={floorplan} customFloorplanPicture={customFloorplanPicture?.url} sqft={sqft} bed={bed} bath={bath} />
        <AttentionCTA
          eyebrow="Inspired by this ADU?"
          title="Designed specifically for your property"
          description="With years of experience building ADUs across Southern California, we begin by carefully reviewing your property, local requirements, and long-term goals. From there, we outline realistic options so you can move forward with clarity and confidence."
          primaryLabel="See what your property allows"
          primaryHref="/talk-to-an-adu-specialist"
          secondaryText="Learn about our approach"
          secondaryHref="/about-us/our-process"
        />
        {selections && (
          <div className={styles.selectionsSection}>
            <h2 className={styles.selectionsTitle}>Designed With Purpose, Finished With Care</h2>
            <p className={styles.selectionsText}>Every finish and fixture is selected with intention</p>
            <SelectionsGallery data={groupedSelections} variant='property' />
            <SoftCTA
              linkText="See what&rsquo;s included"
              href="/selections"
            />
          </div>
        )}
        <RelatedProperties properties={relatedProperties}></RelatedProperties>
      </main>
      <Footer />
    </>
  ) : (
    <LegacyPropertiesPage params={slug} />

  )
}
