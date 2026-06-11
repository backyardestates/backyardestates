import { buildMetadata } from '@/lib/seo'

// Booking widget — no SEO value, keep it out of the index.
export const metadata = buildMetadata({
    title: 'Book Your Phone Consultation',
    description: 'Schedule your free Backyard Estates ADU phone consultation.',
    path: '/talk-to-an-adu-specialist/schedule-call/calendly',
    noindex: true,
})

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
