import style from './DateTime.module.css'

function formatDate(date) {
    const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ]
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ]

    const day = days[date.getDay()]
    const month = months[date.getMonth()]
    const dayOfMonth = date.getDate()

    // Add ordinal suffix
    const ordinalSuffix = (dayOfMonth) => {
        if (dayOfMonth > 3 && dayOfMonth < 21) return 'th' // Covers 11th-19th
        switch (dayOfMonth % 10) {
            case 1:
                return 'st'
            case 2:
                return 'nd'
            case 3:
                return 'rd'
            default:
                return 'th'
        }
    }

    return `${day}, ${month} ${dayOfMonth}${ordinalSuffix(dayOfMonth)}`
}

// Example usage:

export default function DateTime({ date, start, finish }) {
    const tempDate = new Date(date) // December 20th, 2024

    return (
        <li className={style.base}>
            {formatDate(tempDate)}
            <br />
            {start}&ndash;{finish}
        </li>
    )
}
