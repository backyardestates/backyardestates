import { StepProps } from '@/lib/props'

const Step1: React.FC<StepProps> = ({
    setStep,
    preferences,
    setPreferences,
}) => {
    const handleClick = (answer: string) => {
        let updatedValue = {}
        if (answer === 'other') {
            updatedValue = { purpose: 'Other' }

            setPreferences((preferences: any) => ({
                ...preferences,
                ...updatedValue,
            }))
            setStep(6)
        } else {
            updatedValue = { purpose: answer }

            setPreferences((preferences: any) => ({
                ...preferences,
                ...updatedValue,
            }))
            setStep(7)
        }
    }

    return (
        <>
            <h2 className="multistep">Why do they need to build an ADU?</h2>
            <div className="multistep buttons">
                <button
                    className="multistep button"
                    onClick={() => handleClick('family')}
                >
                    To provide housing for family
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick('rental')}
                >
                    To generate rental income
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick('other')}
                >
                    For a different reason
                </button>
            </div>
        </>
    )
}

export default Step1
