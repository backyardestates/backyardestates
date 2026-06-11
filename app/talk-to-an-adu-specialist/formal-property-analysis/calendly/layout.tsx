import { buildMetadata } from '@/lib/seo'

// Booking widget — no SEO value, keep it out of the index.
export const metadata = buildMetadata({
    title: 'Book Your Formal Property Analysis',
    description:
        'Schedule your Backyard Estates Formal Property Analysis — an onsite ADU feasibility review.',
    path: '/talk-to-an-adu-specialist/formal-property-analysis/calendly',
    noindex: true,
})

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
