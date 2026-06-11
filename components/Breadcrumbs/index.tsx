import Link from 'next/link'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faChevronRight } from '@fortawesome/pro-light-svg-icons'

import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/jsonLd'

import style from './Breadcrumbs.module.css'

type Page = { href: string; title: string }

export default function Breadcrumbs({ pages }: { pages: Page[] }) {
    const ld = breadcrumbSchema([
        { name: 'Home', href: '/' },
        ...pages.map((p) => ({ name: p.title, href: p.href })),
    ])
    return (
        <ul className={style.base}>
            <JsonLd data={ld} />
            <li>
                <div className={style.breadcrumb}>
                    <FontAwesomeIcon icon={faHome} />
                    <Link href="/">Home</Link>
                </div>
            </li>
            {pages.map((page, index) => (
                <li key={index}>
                    <div className={style.breadcrumb}>
                        <FontAwesomeIcon icon={faChevronRight} />
                        <Link href={page.href}>{page.title}</Link>
                    </div>
                </li>
            ))}
        </ul>
    )
}
