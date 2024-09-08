import { StepProps } from '@/lib/props'

const Step3: React.FC<StepProps> = ({
    setStep,
    preferences,
    setPreferences,
}) => {
    const handleClick = (answer: number) => {
        let updatedValue = {}
        updatedValue = { bedrooms: answer }

        setPreferences((preferences: any) => ({
            ...preferences,
            ...updatedValue,
        }))

        setStep(4)
    }

    return (
        <>
            <h2 className="multistep">How many bedrooms do you need?</h2>
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
                <button
                    className="multistep button"
                    onClick={() => handleClick(3)}
                >
                    3
                </button>
            </div>
        </>
    )
}

export default Step3
