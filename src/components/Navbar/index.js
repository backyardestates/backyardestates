import Link from 'next/link'
import Logo from '../Logo'
import style from './Navbar.module.css'

export default function Navbar() {
    return (
        <div className="container">
            <nav className={style.root}>
                <div className={style.left}>
                    <Logo />
                </div>
                <ul className={style.links}>
                    <li>
                        <Link href="#">Floor plans</Link>
                    </li>
                    <li>
                        <Link href="/pricing">Pricing</Link>
                    </li>
                    <li>
                        <Link href="#">Company</Link>
                    </li>
                    <li>
                        <Link href="/contact-us">Contact us</Link>
                    </li>
                </ul>
                <div className={style.right}>
                    <Link
                        href="/talk-to-an-adu-specialist"
                        className="btn-primary"
                    >
                        Talk to an ADU specialist
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <g opacity="0.5">
                                <path
                                    d="M9 18L15 12L9 6"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </g>
                        </svg>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
