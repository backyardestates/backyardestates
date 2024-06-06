import Image from 'next/image'

import style from './Feature.module.css'

export default function Feature() {
    return (
        <div className={style.base}>
            <Image
                src="/images/features/featureFPO.png"
                width={203}
                height={114}
                alt="FPO"
            />
            <h3>Feature title</h3>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                eiusmod tempor incididunt ut labore et dolore magna.
            </p>
        </div>
    )
}
