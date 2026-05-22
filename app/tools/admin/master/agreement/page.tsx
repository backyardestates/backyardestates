// Editable agreement preview. Reads proposal data from a handoff key the
// admin tab wrote into localStorage right before opening this tab, generates
// the populated .docx via the same template+generator the header button uses,
// then converts the DOCX to HTML via mammoth so the user can edit inline
// before printing or downloading.

import { AgreementPreviewClient } from "./AgreementPreviewClient";

export const dynamic = "force-dynamic";

export default function AgreementPreviewPage() {
    return <AgreementPreviewClient />;
}
