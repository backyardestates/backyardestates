export const FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]|order(orderID asc){name,slug}`
export const PRICING_FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]|order(orderID asc){orderID, isClickable, slug, name, bed, bath, length, width, price}`
export const CUSTOMER_STORIES_QUERY = `
  *[_type == "story" && featured] | order(publishedAt desc) {
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

export const OPEN_HOUSES_QUERY = `
*[_type == "openHouse" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  dates,
  location,
  propertyDetails {
    sqft,
    beds,
    baths
  },
  timeline[]{
    week,
    milestoneTitle,
    description,
    "imageUrl": image.url,
    "imagePublicId": image.public_id,
    socialLink
  },
  projectMedia {
    professionalPhotos[] {
      "url": url,
      "publicId": public_id
    },
    flyers[] {
      "url": url,
      "publicId": public_id
    },
    floorplans[] {
      "url": url,
      "publicId": public_id
    }
  },
  includedItems[] {
    title,
    description,
    items
  },
  createdAt
}
`

// queries.ts
export const ALL_OPEN_HOUSES_QUERY = `
*[_type == "openHouse"] | order(dates[0] desc){
  _id,
  title,
  "slug": slug.current,
  dates,
  location,
  propertyDetails {
    sqft,
    beds,
    baths
  },
  projectMedia {
    professionalPhotos[] {
      "url": url,
      "publicId": public_id
    },
  }
}
`;