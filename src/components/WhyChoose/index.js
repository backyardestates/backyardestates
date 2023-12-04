import style from './WhyChoose.module.css'

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
                <div className={`${style.benefit} ${style.b1}`}>
                    Were meticulous planners
                </div>
                <div className={`${style.benefit} ${style.b2}`}>
                    Were affordable
                </div>
                <div className={`${style.benefit} ${style.b3}`}>
                    We aim for beauty
                </div>
                <div className={`${style.benefit} ${style.b4}`}>
                    We eliminate delays
                </div>
                <div className={`${style.benefit} ${style.b5}`}>
                    Were quicker
                </div>
            </div>
        </div>
    )
}
