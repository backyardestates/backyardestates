import { Roboto } from 'next/font/google'

const roboto = Roboto({ subsets: ['latin'], weight: ['100', '300'] })

export const metadata = {
  title: 'Backyard Estates',
  description: 'Backyard Estates - Premier Accessory Dwelling Unit (ADU) builder for the greater Los Angeles area.',
}

import Footer from '../../components/Footer'
 
export default function Page({ children }) {
  return (
    <>
      <main>{children}</main>
      <Footer />
    </>
  )
}
