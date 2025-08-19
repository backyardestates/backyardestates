import Link from 'next/link'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faChevronRight } from '@fortawesome/pro-light-svg-icons'

import style from './Breadcrumbs.module.css'

export default function Breadcrumbs({ pages }) {
    return (
        <ul className={style.base}>
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
