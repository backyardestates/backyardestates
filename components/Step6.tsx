import { StepProps } from '@/lib/props'

const Step6: React.FC<StepProps> = ({
    setStep,
    preferences,
    setPreferences,
}) => {
    const handleClick = (answer: string) => {
        let updatedValue = {}
        updatedValue = { homeType: answer }

        setPreferences((preferences: any) => ({
            ...preferences,
            ...updatedValue,
        }))
        setStep(7)
    }

    return (
        <>
            <h2 className="multistep">What is the property home type?</h2>
            <div className="multistep buttons">
                <button
                    className="multistep button"
                    onClick={() => handleClick('Single-family')}
                >
                    Single-family home
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick('Multi-family')}
                >
                    Multi-family home
                </button>
            </div>
        </>
    )
}

export default Step6
