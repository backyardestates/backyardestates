import { Img } from '@react-email/components'

interface EmailTemplateProps {
    from: string
    name: string
    email: string
    message: string
    collection: string
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    from,
    name,
    email,
    message,
    collection,
}) => (
    <div>
        <p
            style={title}
        >{`${name} thought you might like an Accessory Dwelling Unit (ADU) by Backyard Estates`}</p>
        <p>
            <strong>Message:</strong>
        </p>
        <p>{message}</p>
        <p>
            <strong>Recommended package: </strong>
            {collection}
        </p>
        <hr style={rule} />
        <Img
            src="https://backyardestates.b-cdn.net/backyard-estates-logo.png"
            alt="Backyard Estates logo"
            width="180"
            height="50"
        />
        <p>
            Premier Accessory Dwelling Unit (ADU) builder for the greater Los
            Angeles area.
        </p>
        <ul style={list}>
            <li style={listItem}>
                <a
                    href="https://www.backyardestates.com/properties"
                    style={link}
                >
                    View floor plans
                </a>
            </li>
            <li style={listItem}>
                <a
                    href="https://www.backyardestates.com/standard-inclusions"
                    style={link}
                >
                    View standard inclusions
                </a>
            </li>
        </ul>
    </div>
)

const title = {
    color: '#121212',
    fontSize: '1rem',
}

const rule = {
    border: 'none',
    borderBottom: '2px solid #c4c4c4',
}

const list = {
    margin: 0,
    padding: 0,
    listStyle: 'none',
}

const listItem = {
    paddingBottom: '0.75rem',
}

const link = {
    color: '#1da3ba',
    textDecoration: 'none',
    borderBottom: '1px solid #1da3ba',
    paddingBottom: '4px',
}

const table = {
    color: '#787878',
    border: '1px solid #c4c4c4',
    padding: '1.5rem',
}

const tdFirst = {
    paddingRight: '1rem',
}
