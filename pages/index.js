import Link from 'next/link'
import Layout from '../src/layouts/Page'

export default function Home() {
  return (
    <Layout><main>
      <h1>BackyardEstates.com</h1>
      <h2>Homepage</h2>
      <p><Link href="/about">About us</Link></p>
    </main></Layout>
  )
}
