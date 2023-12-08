import Layout from '../../src/layouts/Page'
import style from './Form.module.css'

export default function LeadForm() {
    return (
        <Layout
            title="Talk to an ADU specialist"
            explanation="Aliquet risus feugiat in ante metus dictum at tempor commodo ullamcorper a lacus vestibulum sed arcu non odio euismod lacinia at quis risus sed vulputate odio."
        >
            <div className={style.content}>Placeholder for content</div>
        </Layout>
    )
}
