import Link from 'next/link'

export default function Navbar() {
  return (
    <nav>
      <ul><li><Link href="/">Homepage</Link></li>
      <li><Link href="#">Floor plans</Link></li>
      <li><Link href="/pricing">Pricing</Link></li>
      <li><Link href="#">Company</Link></li>
      <li><Link href="/contact-us">Contact us</Link></li>
      <li><Link href="/talk-to-an-adu-specialist">Talk to an ADU specialist</Link></li></ul>
    </nav>
  )
}
