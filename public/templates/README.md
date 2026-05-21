# ADU Agreement Template — setup

The **Generate Agreement** button in the admin tool fills a Word `.docx`
template with proposal data using
[docxtemplater](https://docxtemplater.com/).

The template must live at:

```
public/templates/adu-agreement-template.docx
```

Replace this file with your own `.docx`. The reference document you started
from is `09 ADU Agreement Mustang.docx` — copy it here and replace the parts
that vary per customer with the placeholder tags below.

## Placeholder reference

Tags use docxtemplater's default syntax: `{tagName}` for a single value,
`{#listName}…{/listName}` for repeated rows.

### Single-value tags

| Tag                | Example output      | Where it comes from                              |
| ------------------ | ------------------- | ------------------------------------------------ |
| `{customerName}`   | Jane Acheson        | Step 1 — Who & Where                             |
| `{customerLastName}` | Acheson           | Last whitespace-separated token of customerName  |
| `{propertyAddress}`| 7034 Harne Ct, …    | Step 1 — Who & Where                             |
| `{city}`           | Rancho Cucamonga    | Parsed from `propertyAddress`                    |
| `{state}`          | CA                  | Parsed from `propertyAddress`                    |
| `{zip}`            | 91739               | Parsed from `propertyAddress`                    |
| `{today}`          | May 20, 2026        | Generated at click time                          |
| `{todayShort}`     | 5/20/2026           | Generated at click time                          |
| `{contractDate}`   | May 20, 2026        | Alias of `today`                                 |
| `{aduName}`        | The Vista 850       | Floorplan named on the payment schedule          |
| `{aduSqft}`        | 850 sqft            | Formatted                                        |
| `{contractTotal}`  | $235,000            | `proposalPaymentSchedule.totalPrice`             |
| `{siteWorkTotal}`  | $24,750             | Sum of site-work line items                      |
| `{discountTotal}`  | $5,000              | Sum of discount line items                       |

### Loops

```text
{#paymentSchedule}
  {index}.  {label} — {trigger} — {amount}
{/paymentSchedule}
```

| Tag inside the loop | Type   | Example                |
| ------------------- | ------ | ---------------------- |
| `{index}`           | number | 1, 2, 3 …              |
| `{label}`           | text   | Foundation deposit     |
| `{trigger}`         | text   | Upon foundation pour   |
| `{amount}`          | text   | $32,500                |
| `{amountNumber}`    | number | 32500 (for raw math)   |

```text
{#siteWork}
  {label} … {amount}
{/siteWork}
```

```text
{#discounts}
  {label} … {amount}
{/discounts}
```

```text
{#exclusions}
  • {item}
{/exclusions}
```

Exclusions are entered by the admin in a prompt when they click
**Generate Agreement** — one item per line. The previously entered list is
remembered in localStorage so it auto-populates next time.

## How to add a tag to your `.docx`

In Microsoft Word:

1. Open the document.
2. Click where the data should appear.
3. Type the tag exactly as written above, including the braces:
   `{customerName}`. Word may auto-correct curly quotes — make sure the braces
   stay as `{` and `}`, not `“…”`.
4. To start a loop, type the opening tag (e.g. `{#paymentSchedule}`) on its
   own line in a table cell or paragraph, the row template right after, then
   the closing tag (`{/paymentSchedule}`).
5. Save as `.docx` and put the file here as `adu-agreement-template.docx`.

## How to verify

In the admin tool, finish a proposal and click **Generate Agreement**. If a
tag is malformed, the button shows an error listing every broken tag — fix
those, save, and try again.

## Adding new fields

To expose a new piece of proposal data:

1. Add the field to `AgreementTemplateData` in
   `lib/agreement/buildAgreementData.ts`.
2. Populate it in `buildAgreementData()` from whatever admin state you want.
3. Add the corresponding `{newTag}` to the .docx template.

No other code changes needed — the data is passed verbatim to docxtemplater.
