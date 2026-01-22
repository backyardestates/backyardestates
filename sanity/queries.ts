export const FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]|order(orderID asc){name,slug}`
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

