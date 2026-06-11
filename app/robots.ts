import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/business'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                // Includes Googlebot, Bingbot, and the AI crawlers (GPTBot,
                // ClaudeBot, PerplexityBot, Google-Extended) — we WANT those
                // reading the site, so no AI-specific blocks here.
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/events/checkin',
                    '/selections',
                    '/tools/',
                    '/admin',
                    '/auth/',
                    '/*/calendly',
                    '/*/rsvp',
                    '/talk-to-an-adu-specialist/message',
                    '/standard-inclusions/share-with-a-friend',
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}
