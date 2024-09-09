import { StepProps } from '@/lib/props'

const Step9: React.FC<StepProps> = ({
    setStep,
    preferences,
    setPreferences,
}) => {
    const handleClick = (answer: string) => {
        let updatedValue = {}
        updatedValue = { timeline: answer }

        setPreferences((preferences: any) => ({
            ...preferences,
            ...updatedValue,
        }))
        setStep(10)
    }

    return (
        <>
            <h2 className="multistep">When do they need their ADU?</h2>
            <div className="multistep buttons">
                <button
                    className="multistep button"
                    onClick={() => handleClick('ASAP')}
                >
                    As soon as possible
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick('Year')}
                >
                    Between 12-24 months
                </button>
                <button
                    className="multistep button"
                    onClick={() => handleClick('Flexible')}
                >
                    We&apos;re flexible
                </button>
            </div>
        </>
    )
}

export default Step9
