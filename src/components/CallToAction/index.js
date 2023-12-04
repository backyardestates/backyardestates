import StandaloneLink from '@/components/StandaloneLink'
import style from './CallToAction.module.css'

export default function CallToAction({ title, ctaLabel, ctaUrl, children }) {
    return (
        <div className={style.base}>
            <h3 className={style.title}>{title}</h3>
            {children}
            <StandaloneLink href={ctaUrl}>{ctaLabel}</StandaloneLink>
        </div>
    )
}
