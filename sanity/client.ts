import { createClient } from 'next-sanity'

export const client = createClient({
    projectId: '4sw2w31c',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2025-07-25',
    useCdn: false,
})