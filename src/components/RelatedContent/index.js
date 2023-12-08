import StandaloneLink from '@/components/StandaloneLink'
import style from './RelatedContent.module.css'
import Property from '../Property'

export default function Properties({ href, children }) {
    return (
        <div className={style.root}>
            <h2>Explore 450 Estate floor plans</h2>
            <p>
                Sed tortor eu placerat porta sed nec fames volutpat. Ultricies
                fermentum donec pulvinar a mollis. Pellentesque eget non mattis
                sit massa eu a magna.
            </p>
            <div className={style.properties}>
                <Property
                    img="/images/property/estate350-fpo.png"
                    floorplan="Estate 350"
                    bed={1}
                    bath={1}
                    sqft={350}
                />
                <Property
                    img="/images/property/estate350-fpo.png"
                    floorplan="Estate 350"
                    bed={1}
                    bath={1}
                    sqft={350}
                />
            </div>
            <StandaloneLink href="/floor-plans">
                View all floor plans
            </StandaloneLink>
        </div>
    )
}
