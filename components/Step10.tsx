import { StepProps } from '@/lib/props'

const Step10: React.FC<StepProps> = ({
    setStep,
    preferences,
    setPreferences,
}) => {
    const handleClick = (answer: string) => {
        let updatedValue = {}
        updatedValue = { unitType: answer }

        setPreferences((preferences: any) => ({
            ...preferences,
            ...updatedValue,
        }))
        setStep(11)
    }

    return (
        <>
            <h2 className="multistep">What type of ADU do they need?</h2>
            <div className="multistep buttons">
                <button
                    className="multistep button"
                    onClick={() => handleClick('Detached')}
                >
                    Detached
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick('Attached')}
                >
                    Attached
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick('Conversion')}
                >
                    Conversion
                </button>
            </div>
        </>
    )
}

export default Step10
