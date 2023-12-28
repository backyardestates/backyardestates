import Benefit from '../Benefit'
import StandaloneLink from '../StandaloneLink'
import style from './Benefits.module.css'

export default function WhyChoose() {
    return (
        <div className={style.root}>
            <div className={style.content}>
                <h2 className={style.subhead}>Why choose Backyard Estates?</h2>
                <p className={style.intro}>
                    From start to finish, we&apos;ve simplified the Accessory
                    Dwelling Unit (ADU) build process. We take care of
                    everything, so you don&apos;t have to worry.
                </p>
            </div>

            <div className={style.benefits}>
                <Benefit
                    position={0}
                    title="Effortless experience"
                    type="process"
                >
                    <p>
                        <mark>
                            Tortor posuere ac ut consequat semper viverra nam
                            libero justo laoreet sit amet cursus sit amet dictum
                            sit amet justo donec{' '}
                        </mark>
                    </p>
                    <ul className={style.bullets}>
                        <li>
                            <mark>One</mark>
                        </li>
                        <li>
                            <mark>Two</mark>
                        </li>
                        <li>
                            <mark>Three</mark>
                        </li>
                    </ul>
                    <StandaloneLink href="/about-us/our-process">
                        View our process
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={1}
                    title="Superior quality"
                    type="quality"
                    subtle
                >
                    <p>
                        <mark>
                            Tortor posuere ac ut consequat semper viverra nam
                            libero justo laoreet sit amet cursus sit amet dictum
                            sit amet justo donec{' '}
                        </mark>
                    </p>
                    <ul className={style.bullets}>
                        <li>
                            <mark>One</mark>
                        </li>
                        <li>
                            <mark>Two</mark>
                        </li>
                        <li>
                            <mark>Three</mark>
                        </li>
                    </ul>
                    <StandaloneLink href="/about-us/our-process">
                        View floor plans
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={2}
                    title="Transparent pricing"
                    type="pricing"
                >
                    <p>
                        <mark>
                            Tortor posuere ac ut consequat semper viverra nam
                            libero justo laoreet sit amet cursus sit amet dictum
                            sit amet justo donec{' '}
                        </mark>
                    </p>
                    <ul className={style.bullets}>
                        <li>
                            <mark>One</mark>
                        </li>
                        <li>
                            <mark>Two</mark>
                        </li>
                        <li>
                            <mark>Three</mark>
                        </li>
                    </ul>
                    <StandaloneLink href="/about-us/our-process">
                        View pricing
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={3}
                    title="Over 100 years of combined experience"
                    type="team"
                >
                    <p>
                        <mark>
                            Tortor posuere ac ut consequat semper viverra nam
                            libero justo laoreet sit amet cursus sit amet dictum
                            sit amet justo
                        </mark>
                    </p>
                    <ul className={style.bullets}>
                        <li>
                            <mark>One</mark>
                        </li>
                        <li>
                            <mark>Two</mark>
                        </li>
                        <li>
                            <mark>Three</mark>
                        </li>
                    </ul>
                    <StandaloneLink href="/about-us/our-process">
                        View team profiles
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={4}
                    title="Swift move-in"
                    type="timeline"
                    subtle
                >
                    <p>
                        <mark>
                            Tortor posuere ac ut consequat semper viverra nam
                            libero justo laoreet sit amet cursus sit amet dictum
                            sit amet justo
                        </mark>
                    </p>
                    <ul className={style.bullets}>
                        <li>
                            <mark>One</mark>
                        </li>
                        <li>
                            <mark>Two</mark>
                        </li>
                        <li>
                            <mark>Three</mark>
                        </li>
                    </ul>
                    <StandaloneLink href="/about-us/our-process">
                        View our process
                    </StandaloneLink>
                </Benefit>
            </div>
        </div>
    )
}
