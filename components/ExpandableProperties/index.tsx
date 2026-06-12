'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import PropertyCard from '../PropertyCard'
import style from './ExpandableProperties.module.css'

/**
 * Property-card grid that shows the first `initial` builds and reveals the rest
 * behind a "View all" button. Keeps long lists tidy on the city pages.
 */
export default function ExpandableProperties({
    properties,
    initial = 6,
    label = 'ADUs',
}: {
    properties: any[]
    initial?: number
    label?: string
}) {
    const [expanded, setExpanded] = useState(false)
    const shown = expanded ? properties : properties.slice(0, initial)
    const remaining = properties.length - initial

    return (
        <>
            <div className={style.grid}>
                {shown.map((p) => (
                    <PropertyCard key={p._id} content={p} />
                ))}
            </div>
            {remaining > 0 && !expanded && (
                <div className={style.moreWrap}>
                    <button
                        type="button"
                        className={style.moreBtn}
                        onClick={() => setExpanded(true)}
                    >
                        View all {properties.length} {label}
                        <ChevronDown size={18} />
                    </button>
                </div>
            )}
        </>
    )
}
