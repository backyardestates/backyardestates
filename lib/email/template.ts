import { REP_CONFIG } from "@/lib/config/repConfig";
import { emailBodyToHtml } from "@/lib/email/render";

// Wide black wordmark logo (same asset used in the feasibility PDF).
const LOGO_URL =
    "https://res.cloudinary.com/backyardestates/image/upload/v1770304856/Team/full_black_long_logo-2_ldkn23.png";

const TEAL = "#2D5F5F";
const TEAL_INK = "#14302F";
const GOLD = "#B8954A";
const CREAM = "#f7f5f0";
const PAPER = "#ffffff";
const INK_MUTED = "#5A5550";
const BORDER = "#e5e1d8";

/**
 * Wrap a rendered email body in the Backyard Estates branded shell: logo
 * header, gold rule, the message, an auto signature, and a footer. Email-safe
 * (table layout + inline styles + web-safe fonts).
 */
export function renderBrandedEmail(opts: { bodyHtml: string; previewText?: string }): string {
    const { bodyHtml, previewText } = opts;
    const c = REP_CONFIG;
    const site = c.website.startsWith("http") ? c.website : `https://${c.website}`;
    const year = new Date().getFullYear();
    const preheader = previewText
        ? `<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${previewText}</span>`
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
</head>
<body style="margin:0;padding:0;background:${CREAM};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:28px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${PAPER};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:28px 36px 0;">
            <img src="${LOGO_URL}" alt="${c.company}" width="220" style="display:block;width:220px;max-width:60%;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:18px 36px 0;">
            <div style="height:2px;width:64px;background:${GOLD};"></div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:22px 36px 8px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#1A1A1A;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Signature -->
        <tr>
          <td style="padding:8px 36px 28px;font-family:Helvetica,Arial,sans-serif;">
            <p style="margin:0 0 2px;font-size:15px;color:#1A1A1A;">Warm regards,</p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${TEAL_INK};">The ${c.company.replace(/\s+LLC$/, "")} Team</p>
            <p style="margin:6px 0 0;font-style:italic;color:${GOLD};font-size:14px;">${c.tagline}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${INK_MUTED};line-height:1.7;">
                  <a href="tel:${c.phone.replace(/[^\d+]/g, "")}" style="color:${TEAL};text-decoration:none;">${c.phone}</a>
                  &nbsp;&middot;&nbsp;
                  <a href="${site}" style="color:${TEAL};text-decoration:none;">${c.website}</a><br/>
                  ${c.address}<br/>
                  <span style="color:#8A8278;">${c.licenseContractor} &nbsp; ${c.licenseDealership}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!-- Footer -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
        <tr>
          <td style="padding:18px 36px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#8A8278;text-align:center;line-height:1.6;">
            ${c.company} &middot; ${c.address}<br/>
            &copy; ${year} ${c.company}. ${c.tagline}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Convenience: render a plain markdown body straight into the branded shell. */
export function renderBrandedEmailFromBody(body: string, previewText?: string): string {
    return renderBrandedEmail({ bodyHtml: emailBodyToHtml(body), previewText });
}
