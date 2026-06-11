export const FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]|order(orderID asc){name,slug}`

// Lean query for a property's <head> metadata (avoids the heavy PROPERTY_QUERY).
export const PROPERTY_META_QUERY = `*[_type == "property" && slug.current == $slug][0]{
  "city": address.city,
  location,
  bed, bath, sqft,
  "floorplan": floorplan->name
}`

// ---------------------------------------------------------------------------
// Lean slug + lastmod queries for app/sitemap.ts (metadata only, no blobs).
// ---------------------------------------------------------------------------
export const SITEMAP_FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
export const SITEMAP_PROPERTIES_QUERY = `*[_type == "property" && defined(slug.current) && defined(photos) && count(photos) > 0]{ "slug": slug.current, _updatedAt }`
export const SITEMAP_STORIES_QUERY = `*[_type == "story" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
export const SITEMAP_POSTS_QUERY = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current, "category": categories->slug.current, _updatedAt }`
export const SITEMAP_OPEN_HOUSES_QUERY = `*[_type == "property" && defined(openHouseDates) && count(openHouseDates) > 0 && defined(slug.current)]{ "slug": slug.current, _updatedAt }`

// Completed builds in (or near) a given city — powers the "real local proof"
// section on the /adu-builder/[city] service-area pages. Matches BOTH schemas:
//   - new units: address.city + photos[]
//   - legacy units: location "City, ST" string + a single thumbnail
// $city is a token like "Rancho Cucamonga"; GROQ `match` is case-insensitive
// and token-based, so this is intentionally loose (it can over-match e.g.
// "West Covina" for "Covina"). The page does an exact, normalized city filter
// in JS to drop those false positives — see app/adu-builder/[city]/page.tsx.
export const PROPERTIES_BY_CITY_QUERY = `*[
  _type == "property" &&
  defined(slug.current) &&
  ((defined(photos) && count(photos) > 0) || defined(thumbnail)) &&
  (address.city match $city || location match $city)
]
| order(coalesce(publishedAt, _createdAt) desc){
  _id,
  name,
  "slug": slug.current,
  completed,
  featured,
  aduType,
  sqft, bed, bath,
  photos,
  "image": coalesce(photos[0].url, thumbnail.secure_url, thumbnail.url),
  "city": address.city,
  location,
  floorplan->{ name, bed, bath, sqft, "slug": slug.current },
  "testimonial": testimonial->{ names, quote, "slug": slug.current }
}`
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
