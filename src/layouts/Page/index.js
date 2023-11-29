import { Roboto } from 'next/font/google'
import style from './Page.module.css'

const roboto = Roboto({
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700', '900'],
})

export const metadata = {
    title: 'Backyard Estates',
    description:
        'Backyard Estates - Premier Accessory Dwelling Unit (ADU) builder for the greater Los Angeles area.',
}

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function Page({ children }) {
    return (
        <div className={roboto.className}>
            <Navbar />
            <main className={style.root}>
                {children}
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Tempor orci dapibus ultrices in iaculis nunc sed
                    augue lacus. Facilisis mauris sit amet massa vitae tortor
                    condimentum. Massa ultricies mi quis hendrerit. Viverra
                    maecenas accumsan lacus vel facilisis volutpat est. Morbi
                    blandit cursus risus at ultrices mi tempus imperdiet nulla.
                    Neque gravida in fermentum et. Faucibus vitae aliquet nec
                    ullamcorper sit amet risus nullam eget. Sit amet consectetur
                    adipiscing elit ut aliquam. Malesuada bibendum arcu vitae
                    elementum curabitur vitae nunc sed. Malesuada fames ac
                    turpis egestas.
                </p>
                <p>
                    Interdum velit laoreet id donec ultrices. Quam vulputate
                    dignissim suspendisse in. Elementum integer enim neque
                    volutpat ac tincidunt vitae semper. Dolor sit amet
                    consectetur adipiscing elit. Lacinia quis vel eros donec.
                    Congue mauris rhoncus aenean vel. Eget nunc scelerisque
                    viverra mauris. Ut sem nulla pharetra diam sit amet nisl
                    suscipit. Quis ipsum suspendisse ultrices gravida dictum
                    fusce. Tempor commodo ullamcorper a lacus vestibulum sed
                    arcu. Potenti nullam ac tortor vitae purus faucibus.
                    Ullamcorper malesuada proin libero nunc consequat interdum
                    varius sit. Pulvinar pellentesque habitant morbi tristique
                    senectus. Purus viverra accumsan in nisl. Odio pellentesque
                    diam volutpat commodo sed egestas egestas. Tellus cras
                    adipiscing enim eu. Id consectetur purus ut faucibus.
                    Convallis convallis tellus id interdum velit laoreet. Eu
                    ultrices vitae auctor eu augue ut. Eget magna fermentum
                    iaculis eu.
                </p>
                <p>
                    Amet nisl suscipit adipiscing bibendum. Aliquam ultrices
                    sagittis orci a scelerisque purus. Interdum varius sit amet
                    mattis. Pretium quam vulputate dignissim suspendisse in est.
                    Luctus venenatis lectus magna fringilla urna porttitor
                    rhoncus. Vitae elementum curabitur vitae nunc. A arcu cursus
                    vitae congue mauris rhoncus aenean. Eget nulla facilisi
                    etiam dignissim diam. Aliquam eleifend mi in nulla posuere
                    sollicitudin aliquam ultrices sagittis. Sit amet mattis
                    vulputate enim nulla aliquet porttitor lacus luctus. Sed
                    tempus urna et pharetra pharetra massa. Nibh ipsum consequat
                    nisl vel pretium lectus. Urna nunc id cursus metus aliquam
                    eleifend mi in. Integer malesuada nunc vel risus commodo
                    viverra maecenas accumsan. Dictum varius duis at consectetur
                    lorem donec massa. Viverra suspendisse potenti nullam ac
                    tortor vitae purus faucibus ornare. Sagittis id consectetur
                    purus ut faucibus. Mauris cursus mattis molestie a iaculis.
                    Id velit ut tortor pretium viverra suspendisse. Erat
                    imperdiet sed euismod nisi porta.
                </p>
            </main>
            <Footer />
        </div>
    )
}
