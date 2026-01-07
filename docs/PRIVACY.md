# Privacy notes (static sites)

This is a static site. Anyone with a direct URL can access content.

## Recommendations
- Do **not** upload real government IDs to a public repository.
- Prefer placeholders for Aadhaar/PAN/Passport, or keep the repo private.
- For true access control, host docs behind an authenticated service.

This project is built to reduce *accidental* discovery:
- Landing page is curated (grouped fairs)
- Profiles are not cross-linked
- `/person/` redirects to `/` to avoid directory listings
