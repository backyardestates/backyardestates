import { z } from 'zod'

export const leadSchema = z.object({
    purpose: z.string().min(1),
    purposeOther: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    ownerName: z.string().min(1),
    ownerPhoneNumber: z.string().min(1),
    ownerPropertyAddress: z.string().min(1),
    ownerRelationship: z.string().min(1),
    contactName: z.string().min(1),
    contactPhone: z.string().min(1),
    bedrooms: z.number(),
    bathrooms: z.number(),
    homeowner: z.string(),
    timeline: z.string(),
    type: z.string(),
    unit: z.string(),
    referralName: z.string().min(1),
    homeType: z.string().min(1),
})

export const contactSchema = z.object({
    contactName: z.string().min(1),
    contactPhone: z.string().min(1),
    zip: z.string().min(1),
    bedroom: z.string(),
    bathroom: z.string(),
    city: z.string(),
})
