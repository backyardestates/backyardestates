import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
    title: 'Refer a Friend to Backyard Estates',
    description:
        'Know someone thinking about building an ADU? Refer them to Backyard Estates and you could earn a referral reward when they build.',
    path: '/submit-a-referral',
})

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
