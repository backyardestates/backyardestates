import { groq } from "next-sanity";

export const FLOORPLANS_QUERY = `*[_type == "floorplan" && isClickable != false && name != "Custom Estate"]|order(orderID asc){_id, bed, bath, sqft, price, name, body, publishedAt, drawing, "floorPlanUrl": drawing.secure_url, slug}`

export const PRICING_FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]|order(orderID asc){orderID, isClickable, slug, name, bed, bath, length, width, price}`
export const CUSTOMER_STORIES_QUERY = `
  *[_type == "story" && featured] | order(publishedAt asc) {
    wistiaId,
    names,
    property->{
      bed,
      bath,
      sqft,
      floorplan->{
        name
      },
      "slug": slug.current
    }
  }
`;

export const TAG_QUERY = `*[_type == "tag" && slug.current == $slug]`

export const POSTS_BY_TAG_QUERY_FEATURED = `*[_type == "post" && $tag in tags[]->slug.current][0...1]{
categories->{slug},
  title,
  slug,
  image,
  _updatedAt,
  tags
}`

export const POSTS_BY_TAG_QUERY = `*[_type == "post" && $tag in tags[]->slug.current][1..-1]{
categories->{slug},
  title,
  slug,
  image,
  _updatedAt,
  tags
}`

export const OPEN_HOUSE_QUERY = `
*[
  _type == "property" &&
  defined(openHouseDates) &&
  count(openHouseDates) > 0
  && slug.current == $slug
][0] {
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

  // =====================================================
  // INCLUDED SELECTIONS (NEW SYSTEM)
  // =====================================================
  "selections": includedSelections[]{
    types[]{
      selections[]->{
        _id,
        title,
        description,
        brand,
        isStandard,
        upgradePrice,
        finishColor,
        finishType,
        rooms,
        images[]{ secure_url },

        "category": {
          "title": ^.^.category->title,
          "slug": { "current": ^.^.category->slug.current }
        },

        "type": {
          "title": ^.type->title,
          "slug": { "current": ^.type->slug.current }
        }
      }
    }
  }[].types[].selections[],

  // ---------------------
  // PUBLISH DATE
  // ---------------------
  publishedAt
}
`

// queries.ts
export const ALL_OPEN_HOUSES_QUERY = `
*[
  _type == "property" &&
  defined(openHouseDates) &&
  count(openHouseDates) > 0
]
| order(openHouseDates[0] desc) {
  _id,
  name,
  "slug": slug.current,
  openHouse,
  openHouseDates[]{
    day,
    startTime,
    endTime
  },
  openHouseFlyers,
  address {
    street,
    unit,
    city,
    state,
    zip
  },
  sqft,
  bed,
  bath,
  floorplan->{
    name,
    bed,
    bath,
    sqft,
    "slug": slug.current
  },
  photos[] {
    "url": url,
    "publicId": public_id
  }
}
`;


export const SELECTIONS_QUERY = `
*[_type == "selection"]{
  _id,
  title,
  description,
  brand,
  isStandard,
  upgradePrice,
  finishColor,
  finishType,
  rooms,
  images[]{
    secure_url
  },
  category->{
    title,
    slug { current }
  },
  type->{
    title,
    slug { current }
  }
} | order(category->title asc, type->title asc, title asc)
`
export const FLOORPLAN_ESTATES_QUERY = `
*[
  _type == "property" &&
  // New completed units OR legacy units (old schema: a thumbnail, no photos array)
  (completed == true || (defined(thumbnail) && !defined(photos))) &&
  floorplan->slug.current == $slug
]
| order(defined(customFloorplanPicture) desc, coalesce(publishedAt, _createdAt) desc) {
  _id,
  name,
  "slug": slug.current,
  bed,
  bath,
  sqft,
  aduType,
  customFloorplan,
  customFloorplanPicture,
  "standardDrawing": floorplan->drawing,
  address { city, state },
  location,
  "testimonial": testimonial->{ names, quote, portrait, "slug": slug.current }
}
`

// Other floorplans (excluding the current one) for the bottom "keep exploring"
// navigation strip on the floorplan detail page.
export const OTHER_FLOORPLANS_QUERY = `*[
  _type == "floorplan" &&
  name != "Custom Estate" &&
  slug.current != $slug
]|order(orderID asc){
  _id, name, "slug": slug.current, bed, bath, sqft, price, drawing
}`

// Pool of every testimonial across all properties, used to top a floorplan up
// to 3 quotes when its own estates don't supply enough.
export const TESTIMONIALS_POOL_QUERY = `
*[
  _type == "property" &&
  defined(testimonial)
]{
  address { city },
  location,
  "testimonial": testimonial->{ names, quote, portrait, "slug": slug.current }
}
`

export const RELATED_PROPERTIES_QUERY = `
*[
  _type == "property" &&
  slug.current != $slug
]
| order(coalesce(publishedAt, _createdAt) desc)[0...6] {
  _id,
  name,
  "slug": slug.current,
  completed,
  featured,
  aduType,
  sqft,
  bed,
  bath,
  photos,
  floorplan->{
    name,
    bed,
    bath,
    sqft,
    "slug": slug.current
  }
}
`



export const PROPERTY_QUERY = `*[_type == "property" && slug.current == $slug][0]{
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

  // =====================================================
  // INCLUDED SELECTIONS (NEW SYSTEM)
  // =====================================================
  "selections": includedSelections[]{
    types[]{
      selections[]->{
        _id,
        title,
        description,
        brand,
        isStandard,
        upgradePrice,
        finishColor,
        finishType,
        rooms,
        images[]{ secure_url },

        "category": {
          "title": ^.^.category->title,
          "slug": { "current": ^.^.category->slug.current }
        },

        "type": {
          "title": ^.type->title,
          "slug": { "current": ^.type->slug.current }
        }
      }
    }
  }[].types[].selections[],

  // ---------------------
  // PUBLISH DATE
  // ---------------------
  publishedAt
}
`

export const PROPERTIES_QUERY = `
  *[
    _type == "property" &&
    defined(photos) &&
    count(photos) > 0
  ]
  | order(coalesce(publishedAt, _createdAt) desc) {
    name,
    "slug": slug.current,
    completed,
    featured,
    aduType,
    sqft,
    bed,
    bath,
    photos,
    floorplan->{
      name,
      bed,
      bath,
      sqft,
      "slug": slug.current
    }
  }
`

export const FLOORPLANS_MATCH_QUERY = `
*[
  _type == "floorplan" &&
  isClickable == true &&
  defined(price) &&
  defined(sqft) &&
  defined(bed) &&
  defined(bath) &&
  lower(name) != "custom estate" &&
  bed >= $bedMin && bed <= $bedMax &&
  bath >= $bathMin && bath <= $bathMax
]{
  _id,
  name,
  bed,
  bath,
  sqft,
  price,
  "slug": slug.current,

  // Drawing: always return a usable URL (or null)
  drawing,

  images,
  
}
`;


export const FLOORPLAN_BY_ID = `
*[_type=="floorplan" && _id==$id][0]{
  _id, name, bed, bath, sqft, price,
  drawing
}
`;

export const REPORT_ASSETS_QUERY = `
*[_type=="pdfReportAssets"][0]{
  brand{
    "logoUrl": logo.asset->url,
    "coverUrl": coverPhoto.asset->url
  },
  gallery[]{
    title,
    "imageUrl": image.asset->url
  }
}
`;

export const FEATURED_STORIES_QUERY = `
*[_type == "story" && featured] | order(publishedAt desc)[0...2]{
  wistiaId,
  names,
  quote,
  portrait,
  "slug": slug.current,
  property->{
    bed, bath, sqft,
    floorplan->{ name },
    "propertySlug": slug.current
  }
}
`;

// Comparable builds (use near-match by bed/bath/sqft if you want; here: latest 6 with photos)
export const COMPARABLE_PROPERTIES_QUERY = `
*[
  _type == "property" &&
  defined(photos) &&
  count(photos) > 0
]
| order(coalesce(publishedAt, _createdAt) desc)[0...6]{
  _id,
  name,
  "slug": slug.current,
  aduType,
  sqft,
  bed,
  bath,
  photos[0]{
    "url": url,
    "publicId": public_id
  },
  floorplan->{
    name,
    bed, bath, sqft,
    "slug": slug.current
  }
}
`;

export const FEATURED_PROPERTIES_QUERY = `
  *[
    _type == "property" && featured &&
    defined(photos) &&
    count(photos) > 0
  ]
  | order(coalesce(publishedAt, _createdAt) desc) {
    name,
    "slug": slug.current,
    completed,
    featured,
    aduType,
    sqft,
    bed,
    bath,
    photos,
    floorplan->{
      name,
      bed,
      bath,
      sqft,
      "slug": slug.current
    }
  }
`




// ─── Presenter View — correct Cloudinary field names ─────────────────────────


export const PRESENTER_FLOORPLANS_QUERY = groq`
  *[_type == "floorplan"
    && !(_id in path("drafts.**"))
    && isClickable == true
    && _id in $ids]
  | order(orderID asc) {
    _id, name, slug, sqft, bed, bath, price,
    length, width, orderID, videoID,
    "floorPlanUrl": drawing.secure_url,
    "images": images[].secure_url,
    "inclusions": body
  }
`

export const PRESENTER_ALL_FLOORPLANS_QUERY = groq`
  *[_type == "floorplan"
    && !(_id in path("drafts.**"))
    && isClickable == true
    && price > 0]
  | order(orderID asc) {
    _id, name, slug, sqft, bed, bath, price,
    length, width, orderID, videoID,
    "floorPlanUrl": drawing.secure_url,
    "images": images[].secure_url,
  }
`

export const PRESENTER_STORIES_QUERY = groq`
  *[_type == "story"]
  | order(_createdAt desc) {
    _id, names, quote, purpose, wistiaId, slug, featured,
    "portraitUrl": portrait.secure_url,
    "images": images[].secure_url,
  }
`

// Completed builds for Slide 5 + the admin Feature Builds picker.
//
// There are TWO generations of `property` docs and we want BOTH (the public
// /properties route already merges them via normalizeNewProperty /
// normalizeLegacyProperty — this is the same idea, done in GROQ):
//   • NEW    — Cloudinary images in `photos[]` (`photos[0].url`).
//   • LEGACY — a single Cloudinary `thumbnail` object (`thumbnail.url`); no
//              `photos`. Same field names otherwise (name/bed/bath/sqft/slug).
//
// The previous query required `defined(photos)`, which silently dropped every
// legacy build. We now accept a build with EITHER a `photos` array OR a
// `thumbnail`, and coalesce the image source so each result is the flat
// SanityProperty shape the store + Feature Builds + Slide 5 already expect —
// no client-side merge and no Slide 5 change needed. `images` (the gallery
// Slide 5 prefers) is photos-only; legacy builds fall back to `thumbnailUrl`,
// which Slide 5's buildImageList already handles.
export const PRESENTER_COMPLETED_PROPERTIES_QUERY = groq`
  *[_type == "property"
    && !(_id in path("drafts.**"))
    && ((defined(photos) && count(photos) > 0) || defined(thumbnail))]
  | order(featured desc, _createdAt desc) [0...100] {
    _id, name, slug, sqft, bed, bath,
    videoID, featured,
    "thumbnailUrl": coalesce(photos[0].url, thumbnail.url),
    "images": photos[].url,
    "floorplanName": floorplan->name,
    "floorplanSqft": floorplan->sqft,
    "location": coalesce(location, city),
  }
`
