import style from './Step.module.css'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/pro-regular-svg-icons'

import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
export default function Step({
    title = 'Step title',
    explanation = 'Lobortis feugiat vivamus at augue eget arcu dictum varius duis at consectetur lorem donec massa sapien faucibus et molestie ac feugiat sed lectus vestibulum',
    showArrow = true,
}) {
    return (
        <div className={style.base}>
            <div className={style.content}>
                <p>
                    <strong>{title}</strong>
                </p>
                <p className={style.explanation}>{explanation}</p>
                <FontAwesomeIcon
                    icon={faCircleQuestion}
                    className={style.icon}
                />
            </div>

            {showArrow && (
                <FontAwesomeIcon
                    icon={faArrowDown}
                    size="xl"
                    className={style.arrow}
                />
            )}
        </div>
    )
}
