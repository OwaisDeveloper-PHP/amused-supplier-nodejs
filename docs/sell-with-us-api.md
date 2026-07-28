# Sell With Us — Public Submission API

Public, unauthenticated endpoint that receives submissions from the storefront
"Sell With Us" form and stores them in the `sell_with_us_submissions` table
(the same table the admin console's **Consignment → Sell With Us Entries**
screens read from).

## Endpoint

```
POST /api/sell-with-us
```

- No login/session required — this route sits **before** the `requireAuth`
  middleware in `src/routes/index.ts`.
- No CSRF token required — `/api/*` paths are exempted from CSRF verification
  in `src/app.ts` (CSRF is a browser-session protection; a public JSON API
  authenticates by other means).
- Accepts either `Content-Type: application/json` or
  `application/x-www-form-urlencoded`. (Do **not** use `multipart/form-data` —
  there's no file-upload middleware wired up; photo/video fields are expected
  to already be hosted URLs, e.g. from Cloudinary, as in the sample payload.)

## Request body

The form posts fields using bracket notation, mirroring the storefront form's
native field names (same shape whether nested as `contact: {...}` via
url-encoded forms, or flat `"contact[Field]"` keys via raw JSON):

```json
{
  "form_type": "contact",
  "utf8": "✓",
  "contact[Selected_Category]": "Bags & Small Leather Goods",
  "contact[Selected_Brand]": "Dior",
  "contact[Item_Condition]": "Brand New",
  "contact[Item_Inclusions]": "Authenticity Card",
  "contact[Item_Model]": "Classic Flap",
  "contact[Item_Colour]": "Black",
  "contact[Item_Size]": "Large",
  "contact[Item_Material]": "Calfskin leather",
  "contact[Year_Purchased]": "2025",
  "contact[Item_Notes]": "Describe anything else — wear, alterations, or special features",
  "contact[Photo_Front_URL]": "https://res.cloudinary.com/.../front.jpg",
  "contact[Photo_Back_URL]": "https://res.cloudinary.com/.../back.jpg",
  "contact[Photo_Sides_URL]": "https://res.cloudinary.com/.../sides.jpg",
  "contact[Photo_Hardware_URL]": "https://res.cloudinary.com/.../hardware.jpg",
  "contact[Photo_Interior_URL]": "https://res.cloudinary.com/.../interior.jpg",
  "contact[Photo_Serial_Code_URL]": "https://res.cloudinary.com/.../serial.jpg",
  "contact[Photo_Inclusions_URL]": "",
  "contact[Photo_Wear_Marks_URL]": "https://res.cloudinary.com/.../wear.jpg",
  "contact[Photo_Extra_URL]": "",
  "contact[Photo_Strap_URL]": "",
  "contact[Walkthrough_Video_URL]": "",
  "contact[Minimum_Price_Accepted]": "4587120",
  "contact[First_Name]": "Owais",
  "contact[Last_Name]": "Hassan",
  "contact[Country_Code]": "+966",
  "contact[Phone_Number]": "5545789",
  "contact[email]": "owais.hassan@nextgeni.com",
  "contact[City]": "Dammam / Khobar",
  "contact[IBAN]": "PK40MEZN0000001123456702",
  "contact[Referral_Source]": "Friend / Referral",
  "h-captcha-response": ""
}
```

### Required fields

The request is rejected with `422` if any of these are missing/blank:

- `contact[First_Name]`
- `contact[Last_Name]`
- `contact[Selected_Category]`
- `contact[Selected_Brand]`
- At least one of `contact[email]` or `contact[Phone_Number]`

Everything else is optional.

### Field mapping

| Payload key                          | Column (`sell_with_us_submissions`) |
|---------------------------------------|--------------------------------------|
| `contact[Selected_Category]`          | `category`                           |
| `contact[Selected_Brand]`             | `brand`                              |
| `contact[Item_Condition]`             | `condition`                          |
| `contact[Item_Inclusions]`            | `inclusions`                         |
| `contact[Item_Model]`                 | `model`                              |
| `contact[Item_Colour]`                | `colour`                             |
| `contact[Item_Size]`                  | `size`                               |
| `contact[Item_Material]`              | `material`                           |
| `contact[Year_Purchased]`              | `year_purchased`                     |
| `contact[Item_Notes]`                 | `notes`                              |
| `contact[Minimum_Price_Accepted]`      | `minimum_price` (numeric)             |
| `contact[Walkthrough_Video_URL]`      | `walkthrough_video`                  |
| `contact[First_Name]` / `Last_Name`   | `first_name` / `last_name`           |
| `contact[Country_Code]` / `Phone_Number` | `country_code` / `phone`          |
| `contact[email]`                      | `email`                              |
| `contact[City]`                       | `city`                               |
| `contact[IBAN]`                       | `iban`                               |
| `contact[Referral_Source]`            | `referral_source`                    |
| `contact[Photo_Front_URL]` … `Photo_Strap_URL` | `photos` (JSON array of `{ url, name }`, blank URLs skipped) |
| `contact[Photo_Extra_URL]`            | `extra_photos` (same shape)          |

Fields not in this table (`form_type`, `utf8`, `h-captcha-response`) are used
for request handling only and are not stored.

On create, the API also sets:
- `reference` — auto-generated, unique, e.g. `SWU-MS4BEA3X3D098A`
- `status` — always starts as `"pending"`

## Responses

**Success — `201 Created`**
```json
{
  "success": true,
  "message": "Submission received.",
  "reference": "SWU-MS4BEA3X3D098A",
  "id": 9
}
```

**Validation error — `422 Unprocessable Entity`**
```json
{
  "success": false,
  "message": "Missing required fields.",
  "fields": ["First_Name", "Last_Name", "email or Phone_Number"]
}
```

**hCaptcha failure — `422 Unprocessable Entity`** (only enforced if `HCAPTCHA_SECRET` is set — see below)
```json
{ "success": false, "message": "hCaptcha verification failed." }
```

**Server error — `500 Internal Server Error`**
```json
{ "success": false, "message": "Something went wrong. Please try again." }
```

## hCaptcha verification

The `h-captcha-response` token is verified server-side against hCaptcha's
`siteverify` endpoint **only if** `HCAPTCHA_SECRET` is set in `.env`. If it's
left blank (default in `.env.example`), verification is skipped — useful for
local development and the Postman tests below, where you won't have a real
token. In production, set `HCAPTCHA_SECRET` to enforce it.

## Testing with Postman

1. **Method / URL**: `POST` → `http://localhost:3000/api/sell-with-us`
   (swap the host for your deployed URL as needed).
2. **Headers**: `Content-Type: application/json`
3. **Body**: select **raw** → **JSON**, and paste the sample payload above
   (or the exact one from your form's `console.log`/network tab).
4. Hit **Send** — expect `201` with a `reference` and `id` back.
5. To test validation, remove `contact[First_Name]` (or similar) from the body
   and resend — expect `422` with a `fields` array listing what's missing.
6. To test the form-urlencoded shape (matches an actual `<form>` submit),
   switch the body type to **x-www-form-urlencoded** and add the same
   `contact[Field]` keys/values as form fields — the server normalizes both
   shapes identically.

A ready-to-import Postman collection is included at
[`docs/postman/sell-with-us.postman_collection.json`](postman/sell-with-us.postman_collection.json)
with three pre-built requests: a full submission, a form-urlencoded
submission, and a missing-fields validation case. Import it via
**Postman → Import → File**, then set the collection variable `baseUrl`
(defaults to `http://localhost:3000`).

## Verifying in the database

Submissions land in `sell_with_us_submissions` and immediately show up in the
admin console under **Consignment → Sell With Us Entries**
(`GET /submissions`, requires login), where they can be approved/rejected,
assigned to a supplier, and have the approval e-mail sent — no changes were
needed there since this API writes to the same table/shape the console
already expects.
