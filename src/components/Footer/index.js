import Link from 'next/link'

export default function Footer() {
  return (
    <footer>
      <p>This is the footer</p>
      <h3>Floor plans</h3>
      <ul><li><Link href="#">Estate 350</Link></li>
      <li><Link href="#">Estate 450</Link></li>
      <li><Link href="#">Estate 500</Link></li>
      <li><Link href="#">Estate 750</Link></li>
      <li><Link href="#">Estate 750+</Link></li>
      <li><Link href="#">Estate 800</Link></li>
      <li><Link href="#">Estate 900</Link></li>
      <li><Link href="#">Estate 1200</Link></li></ul>
      <h3>Resources</h3>
      <ul>
      <li><Link href="/pricing">Pricing</Link></li>
      <li><Link href="/roi">Investment ROI</Link></li></ul>
      <h3>Company</h3><ul><li><Link href="/about-us">About us</Link></li>
      <li><Link href="/about-us/our-team">Our team</Link></li>
      <li><Link href="/about-us/our-process">Our process</Link></li>
      <li><Link href="/contact-us">Contact us</Link></li></ul>
    </footer>
  )
}
