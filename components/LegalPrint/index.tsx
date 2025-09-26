
import Link from "next/link"
import style from "./LegalPrint.module.css"
export default function LegalPrint() {

    return (
        <p className={style.legal_print}>
            By clicking submit, you consent to receive
            marketing emails and automated text messages
            from Backyard Estates at the email address and
            phone number you provided. These messages may be
            sent using an automatic telephone dialing
            system. Consent is not a condition of purchase.
            Message and data rates may apply. Message
            frequency varies. You can opt out at any time by
            clicking the unsubscribe link in our emails or
            replying STOP to our text messages. For more
            information, please review our{' '}
            <Link href="/legal/terms-of-use">
                Terms of Use
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy-policy">
                Privacy Policy
            </Link>
            .
        </p>

    )
}


