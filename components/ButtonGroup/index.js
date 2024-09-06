import Button from '../Button'
import style from './ButtonGroup.module.css'

export default function ButtonGroup({
    labels = ['Walkthrough', 'Floor plan'],
}) {
    // console.log(typeof labels)
    return (
        <div className={style.base}>
            {labels.map((label, index) => (
                <Button
                    key={index}
                    theme="beige"
                    showIcon={false}
                    className={style.button}
                    style={{ borderRadius: '0', backgroundColor: 'red' }}
                >
                    {label}
                </Button>
            ))}
        </div>
    )
}
