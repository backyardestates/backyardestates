import StandaloneLink from '../StandaloneLink'
import style from './Properties.module.css'
import Property from '../Property'

import db from '@/utils/db'

const getProperties = async () => {
    const properties = await db.floorplan.findMany({
        orderBy: [
            {
                order: 'asc',
            },
            {
                title: 'asc',
            },
        ],
        where: {
            isFloorplan: false,
        },
    })
    return properties
}

export default async function Properties() {
    const properties = await getProperties()

    // const filteredProperties = data.filter(
    //     (property) =>
    //         property.id === '400-000' ||
    //         property.id === '450-000' ||
    //         property.id === '750-001' ||
    //         property.id === '751-000' ||
    //         property.id === '800-001' ||
    //         property.id === '950-000' ||
    //         property.id === '1200-000'
    // )

    return (
        <div className={style.base}>
            <div className={style.properties}>
                {properties.map((property, index) => (
                    <Property key={index} floorplan={property} />
                ))}
            </div>
            <div className={style.centered}>
                <StandaloneLink href="/gallery">
                    View all projects
                </StandaloneLink>
            </div>
        </div>
    )
}
