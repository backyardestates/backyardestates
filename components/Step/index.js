'use client'

import { useState } from 'react'

import style from './Step.module.css'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/pro-regular-svg-icons'

import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
import Tooltip from '../Tooltip'
export default function Step({
    title = 'Step title',
    explanation = 'Lobortis feugiat vivamus at augue eget arcu dictum varius duis at consectetur lorem donec massa',
    showArrow = true,
}) {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
        <div className={style.base}>
            <div className={style.content}>
                <p>
                    <strong>{title}</strong>
                </p>
                <p className={style.explanation}>{explanation}</p>
                <div className={style.iconHolder}>
                    <FontAwesomeIcon
                        icon={faCircleQuestion}
                        className={style.icon}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    />
                    <Tooltip show={showTooltip}>{explanation}</Tooltip>
                </div>
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
