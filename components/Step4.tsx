import { StepProps } from '@/lib/props'

const Step4: React.FC<StepProps> = ({
    setStep,
    preferences,
    setPreferences,
}) => {
    const handleClick = (answer: number) => {
        let updatedValue = {}
        updatedValue = { bathrooms: answer }

        setPreferences((preferences: any) => ({
            ...preferences,
            ...updatedValue,
        }))
        setStep(9)
    }

    return (
        <>
            <h2 className="multistep">How many bathrooms do they need?</h2>
            <div className="multistep buttons">
                <button
                    className="multistep button"
                    onClick={() => handleClick(1)}
                >
                    1
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick(2)}
                >
                    2
                </button>
            </div>
        </>
    )
}

export default Step4
