import { Step11Props } from '@/lib/props'

const Step11: React.FC<Step11Props> = ({
    setStep,
    preferences,
    setPreferences,
    setTab,
}) => {
    const handleClick = (answer: string) => {
        let updatedValue = {}
        updatedValue = { unit: answer }

        setPreferences((preferences: any) => ({
            ...preferences,
            ...updatedValue,
        }))
        setStep(13)
        setTab(3)
    }

    const units = [
        { title: 'Estate 350', bed: 0, bath: 1, price: '$185,000' },
        { title: 'Estate 400', bed: 1, bath: 1, price: '$199,000' },
        { title: 'Estate 450', bed: 1, bath: 1, price: '$219,000' },
        { title: 'Estate 500', bed: 2, bath: 1, price: '$239,000' },
        { title: 'Estate 600', bed: 2, bath: 1, price: '$265,000' },
        { title: 'Estate 750', bed: 2, bath: 1, price: '$299,000' },
        { title: 'Estate 750+', bed: 2, bath: 2, price: '$309,000' },
        { title: 'Estate 800', bed: 2, bath: 2, price: '$319,000' },
        { title: 'Estate 950', bed: 3, bath: 2, price: '$359,000' },
        { title: 'Estate 1200', bed: 3, bath: 2, price: '$399,000' },
    ]

    let choices: string[] = []

    switch (preferences.bedrooms) {
        case 0:
            choices.push(units[0].title)
            break
        case 1:
            choices.push(units[1].title)
            choices.push(units[2].title)
            break
        case 2:
            choices.push(units[3].title)
            choices.push(units[4].title)
            choices.push(units[5].title)
            choices.push(units[6].title)
            choices.push(units[7].title)
            break
        case 3:
            choices.push(units[8].title)
            choices.push(units[9].title)
            break
    }

    return (
        <>
            <h2 className="multistep">Choose their preferred ADU unit?</h2>
            <div className="multistep buttons">
                {}
                {choices.map((choice, index) => (
                    <button
                        className="multistep button"
                        onClick={() => handleClick(choice)}
                        key={index}
                    >
                        {choice}
                    </button>
                ))}
            </div>
        </>
    )
}

export default Step11
