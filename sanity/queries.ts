export const FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]|order(orderID asc){name,slug}`
export const PRICING_FLOORPLANS_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]|order(orderID asc){orderID, isClickable, slug, name, bed, bath, length, width, price}`
export const CUSTOMER_STORIES_QUERY = `*[_type == "story" && featured]|order(publishedAt desc){wistiaId,names,property->{bed,bath,sqft,floorplan->{name}}}`

export const TAG_QUERY = `*[_type == "tag" && slug.current == $slug]`

export const POSTS_BY_TAG_QUERY_FEATURED = `*[_type == "post" && $tag in tags[]->slug.current][0...1]{
categories->{slug},
  title,
  slug,
  _updatedAt,
  tags
}`

export const POSTS_BY_TAG_QUERY = `*[_type == "post" && $tag in tags[]->slug.current][1..-1]{
categories->{slug},
  title,
  slug,
  _updatedAt,
  tags
}`
