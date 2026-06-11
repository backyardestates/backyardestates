// Single source of truth for site navigation.
// Both the desktop Nav dropdowns and the mobile Menu render from this so the
// two can never drift out of sync. Organized around the questions a prospect
// actually asks on the way to talking to an ADU specialist.

export interface NavLink {
    href: string
    label: string
    /** One-line description shown in the desktop mega-menu */
    description?: string
}

export interface NavGroup {
    /** Numbered eyebrow, e.g. "01" */
    eyebrow: string
    /** Short label used by the desktop nav trigger */
    label: string
    /** Section hub the desktop trigger links to on click */
    href: string
    /** Editorial question heading shown in the mobile menu */
    heading: string
    links: NavLink[]
}

export const NAV_GROUPS: NavGroup[] = [
    {
        eyebrow: '01',
        label: 'Floor plans',
        href: '/floorplans',
        heading: 'What can we build?',
        links: [
            {
                href: '/floorplans',
                label: 'ADU floorplans',
                description: '10 layouts, 350–1,200 sq ft',
            },
            {
                href: '/properties',
                label: 'Completed ADUs',
                description: 'Real builds across Southern California',
            },
            {
                href: '/standard-inclusions',
                label: 'Standard inclusions',
                description: 'What comes in every build',
            },
            {
                href: '/selections',
                label: 'Finishes & selections',
                description: 'Choose your finishes and materials',
            },
        ],
    },
    {
        eyebrow: '02',
        label: 'Pricing',
        href: '/pricing',
        heading: 'What does it cost?',
        links: [
            {
                href: '/pricing',
                label: 'Pricing',
                description: 'All-inclusive pricing by floor plan',
            },
            {
                href: '/roi',
                label: 'Return on investment',
                description: 'Rental income & property value',
            },
        ],
    },
    {
        eyebrow: '03',
        label: 'How it works',
        href: '/about-us/our-process',
        heading: 'How does it work?',
        links: [
            {
                href: '/about-us/our-process',
                label: 'Our process',
                description: 'From first call to move-in',
            },
            {
                href: '/frequently-asked-questions',
                label: 'Frequently asked questions',
                description: 'Answers to common ADU questions',
            },
        ],
    },
    {
        eyebrow: '04',
        label: 'About',
        href: '/about-us',
        heading: 'Why Backyard Estates?',
        links: [
            {
                href: '/about-us',
                label: 'About us',
                description: 'Who we are & how we work',
            },
            {
                href: '/customer-stories',
                label: 'Customer stories',
                description: 'Hear from the families who built with us',
            },
            {
                href: '/adu-builder',
                label: 'Service areas',
                description: 'Cities we build in across the IE & LA',
            },
            {
                href: '/about-us/our-team',
                label: 'Our team',
                description: 'The people behind your build',
            },
            {
                href: '/events',
                label: 'Events & open houses',
                description: 'Tour ADUs & join seminars',
            },
        ],
    },
]

// Contact / conversion details. Phone values mirror
// app/talk-to-an-adu-specialist/page.tsx so they stay consistent.
export const CONTACT = {
    PHONE_DISPLAY: '(909) 500-0917',
    PHONE_TEL: 'tel:+19095000917',
    HOURS: 'Mon–Fri 8–5',
    specialistHref: '/talk-to-an-adu-specialist',
    scheduleCallHref: '/talk-to-an-adu-specialist/schedule-call',
    officeConsultHref: '/talk-to-an-adu-specialist/office-consultation',
}
