import Link from 'next/link'
import style from './Logo.module.css'

export default function Logo({ mode = 'light' }) {
    return (
        <Link
            id="logo"
            href="/"
            className={mode === 'light' ? style.light : style.dark}
        >
            <svg
                id="Layer_1"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 40 40"
                className={style.logo}
                fill="black"
            >
                <path d="m23.837,1.014L7.235,12.816v10.362h-3.133v-10.993l7.851-5.711.829.905,3.338-2.475-3.617-3.904L0,10.097v17.183h23.025v-14.229l-3.67-3.993,4.32-2.961,12.222,9.566v14.559h-3.324v-6.347h-5.58v6.347h-15.655v-1.742h-4.103v5.844h32.765V13.663L23.837,1.014Zm-4.914,22.164h-7.585v-8.293l4.643-3.435,2.942,3.201v8.528Z" />
            </svg>
            <span className={style.logotype}>Backyard Estates</span>
        </Link>
    )
}
