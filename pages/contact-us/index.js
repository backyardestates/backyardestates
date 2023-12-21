import Layout from '../../src/layouts/Page'
import style from './ContactUs.module.css'
export default function ContactUs() {
    return (
        <Layout
            title="Contact us"
            pageTitle="Contact us - Backyard Estates"
            explanation="Aliquet risus feugiat in ante metus dictum at tempor commodo ullamcorper a lacus vestibulum sed arcu non odio euismod lacinia at quis risus sed vulputate odio."
        >
            <div className={style.content}>Placeholder for content</div>
        </Layout>
    )
}
