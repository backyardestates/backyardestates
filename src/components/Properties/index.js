import Link from 'next/link'
import StandaloneLink from '@/components/StandaloneLink'
import style from './Properties.module.css'
import Property from '../Property'

export default function Properties({ href, children }) {
    return (
        <div className={style.root}>
            <div className={style.properties}>
                <Property
                    img="/images/property/estate350-fpo.png"
                    floorplan="Estate 350"
                    bed={1}
                    bath={1}
                    sqft={350}
                />
                <Property
                    img="/images/property/estate450-fpo.png"
                    floorplan="Estate 450"
                    bed={2}
                    bath={1}
                    sqft={450}
                />
                <Property
                    img="/images/property/estate500-fpo.png"
                    floorplan="Estate 500"
                    bed={2}
                    bath={1}
                    sqft={450}
                />
                <Property
                    img="/images/property/estate750-fpo.png"
                    floorplan="Estate 750"
                    bed={2}
                    bath={1}
                    sqft={450}
                />
            </div>
            <StandaloneLink href="/floor-plans">
                View all properties
            </StandaloneLink>
        </div>
    )
}
