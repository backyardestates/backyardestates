export function groupSelections(selections: any[]) {
    const grouped: Record<string, any> = {}

    selections.forEach((item) => {
        const categoryKey = item.category.slug.current
        const typeKey = item.type.slug.current

        if (!grouped[categoryKey]) {
            grouped[categoryKey] = {
                title: item.category.title,
                types: {},
            }
        }

        if (!grouped[categoryKey].types[typeKey]) {
            grouped[categoryKey].types[typeKey] = {
                title: item.type.title,
                items: [],
            }
        }

        grouped[categoryKey].types[typeKey].items.push(item)
    })

    // 🔑 Sort items: Standard first, Upgrades last
    Object.values(grouped).forEach((category: any) => {
        Object.values((category as any).types).forEach((type: any) => {
            type.items.sort((a: any, b: any) => {
                return Number(a.isStandard === false) - Number(b.isStandard === false)
            })
        })
    })

    return grouped
}

