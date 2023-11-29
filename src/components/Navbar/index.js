import Link from 'next/link'
import Logo from '../Logo'
import style from './Navbar.module.css'
import Button from '../Button'
import Dropdown from '../Dropdown'

export default function Navbar() {
    return (
        <nav className={style.root}>
            <div className={style.container}>
                <div className={style.left}>
                    <Logo />
                </div>
                <ul className={style.links}>
                    <li>
                        <Link href="/floor-plans">Floor plans</Link>
                    </li>
                    <li>
                        <Link href="/pricing">Pricing</Link>
                    </li>
                    <li>
                        <Dropdown label="Company">
                            <ul>
                                <li>
                                    <Link href="/about-us">About us</Link>
                                </li>
                                <li>
                                    <Link href="/about-us/our-team">
                                        Our team
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about-us/our-process">
                                        Our process
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/roi">
                                        Return On Investment (ROI)
                                    </Link>
                                </li>
                            </ul>
                        </Dropdown>
                    </li>
                    <li>
                        <Link href="/contact-us">Contact us</Link>
                    </li>
                </ul>
                <div className={style.right}>
                    <div className={style.cta}>
                        <Button href="/talk-to-an-adu-specialist">
                            Talk to an ADU specialist
                        </Button>
                    </div>

                    <div className={style.menu}>
                        <span>Menu</span>
                        <svg
                            width="20"
                            height="28"
                            viewBox="0 0 20 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M0 6H20"
                                stroke="#5E5E5E"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M0 14H20"
                                stroke="#5E5E5E"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M0 22H20"
                                stroke="#5E5E5E"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </nav>
    )
}
