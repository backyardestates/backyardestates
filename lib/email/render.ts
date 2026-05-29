// Render a lightweight-markdown email body to email-safe, inline-styled HTML.
// Supports: paragraphs, "- "/"* " bullet lists, "1." ordered lists, "#"/"##"
// headings, **bold**, *italic* / _italic_, [links](url), ![images](url), and
// bare URLs. Used by the drip + consultation send paths.

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const LINK_STYLE = "color:#2D5F5F;text-decoration:underline;";
const IMG_STYLE =
    "max-width:100%;height:auto;border-radius:10px;margin:6px 0;display:block;";

/** Inline transforms applied to already-HTML-escaped text. */
function inline(s: string): string {
    // Images first (so the link regex doesn't grab the [alt](url) inside ![..]).
    s = s.replace(
        /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
        (_m, alt: string, url: string) =>
            `<img src="${url}" alt="${alt}" style="${IMG_STYLE}" />`,
    );
    // Markdown links.
    s = s.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        (_m, anchor: string, url: string) =>
            `<a href="${url}" style="${LINK_STYLE}">${anchor}</a>`,
    );
    // Bold, then italic (underscore + single asterisk).
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    // Bare URLs — skip any already inside an attribute/anchor we just produced.
    s = s.replace(
        /(href="|src="|>)?(https?:\/\/[^\s<]+)/g,
        (whole: string, pre: string | undefined, url: string) => {
            if (pre) return whole;
            const trail = url.match(/[.,!?;:]+$/)?.[0] ?? "";
            const core = trail ? url.slice(0, -trail.length) : url;
            return `<a href="${core}" style="${LINK_STYLE}">${core}</a>${trail}`;
        },
    );
    return s;
}

const UL_RE = /^\s*[-*]\s+/;
const OL_RE = /^\s*\d+\.\s+/;
const H_RE = /^\s*(#{1,3})\s+(.*)$/;
const IMG_LINE_RE = /^\s*!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)\s*$/;

export function emailBodyToHtml(text: string): string {
    const lines = escapeHtml(text).split("\n");
    const blocks: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        if (line.trim() === "") {
            i++;
            continue;
        }

        if (UL_RE.test(line)) {
            const items: string[] = [];
            while (i < lines.length && UL_RE.test(lines[i])) {
                items.push(inline(lines[i].replace(UL_RE, "")));
                i++;
            }
            blocks.push(
                `<ul style="margin:0 0 14px;padding-left:22px;color:#1A1A1A;">${items
                    .map((it) => `<li style="margin:0 0 6px;line-height:1.6;">${it}</li>`)
                    .join("")}</ul>`,
            );
            continue;
        }

        if (OL_RE.test(line)) {
            const items: string[] = [];
            while (i < lines.length && OL_RE.test(lines[i])) {
                items.push(inline(lines[i].replace(OL_RE, "")));
                i++;
            }
            blocks.push(
                `<ol style="margin:0 0 14px;padding-left:22px;color:#1A1A1A;">${items
                    .map((it) => `<li style="margin:0 0 6px;line-height:1.6;">${it}</li>`)
                    .join("")}</ol>`,
            );
            continue;
        }

        const h = line.match(H_RE);
        if (h) {
            const size = h[1].length === 1 ? 22 : h[1].length === 2 ? 18 : 16;
            blocks.push(
                `<p style="font-family:Georgia,'Times New Roman',serif;font-size:${size}px;color:#14302F;font-weight:bold;margin:18px 0 10px;">${inline(
                    h[2],
                )}</p>`,
            );
            i++;
            continue;
        }

        if (IMG_LINE_RE.test(line)) {
            blocks.push(`<div style="margin:14px 0;">${inline(line.trim())}</div>`);
            i++;
            continue;
        }

        const para: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !UL_RE.test(lines[i]) &&
            !OL_RE.test(lines[i]) &&
            !H_RE.test(lines[i]) &&
            !IMG_LINE_RE.test(lines[i])
        ) {
            para.push(lines[i]);
            i++;
        }
        blocks.push(
            `<p style="margin:0 0 14px;line-height:1.6;color:#1A1A1A;">${inline(
                para.join("\n"),
            ).replace(/\n/g, "<br/>")}</p>`,
        );
    }

    return blocks.join("\n");
}
