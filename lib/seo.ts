// Central metadata builder. Every page calls `buildMetadata()` so titles,
// descriptions, canonicals, Open Graph, Twitter cards, and robots directives
// stay consistent. The root layout sets a title template ("%s | Backyard
// Estates"), so pass the page-specific title only (no " | Backyard Estates"
// suffix) — `buildMetadata` returns it as `title` and the template adds the rest.
import type { Metadata } from 'next'
import { SITE_URL, business } from '@/lib/business'

const DEFAULT_OG = '/images/backyard-estates-OG.png'

interface BuildMetadataInput {
    /** Page-specific title (the template appends "| Backyard Estates"). */
    title: string
    description: string
    /** Absolute path beginning with "/" — becomes the canonical URL. */
    path: string
    /** OG/Twitter image path or absolute URL. Defaults to the brand OG image. */
    image?: string
    /** Set true for tool/booking/utility pages that shouldn't be indexed. */
    noindex?: boolean
    /** Open Graph type. 'website' (default) or 'article'. */
    type?: 'website' | 'article'
}

export function buildMetadata({
    title,
    description,
    path,
    image = DEFAULT_OG,
    noindex = false,
    type = 'website',
}: BuildMetadataInput): Metadata {
    const url = path.startsWith('http') ? path : `${SITE_URL}${path}`
    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            title,
            description,
            url,
            siteName: business.name,
            type,
            locale: 'en_US',
            images: [{ url: image, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
        robots: noindex
            ? { index: false, follow: true }
            : undefined,
    }
}
