# persona

A futuristic, Bootstrap-based static site that groups profiles by "fairs":

- Job Fair
- Marriage Fair
- Document Vault
- Social Work

## URLs
- Landing: `/`
- Profile: `/<person>/<profile>/` (e.g. `/jatin/job/`)
- Business (global): `/business/`

## Local run
```bash
python3 -m http.server 8080
```

## Data
Edit JSON under `data/people/<person>/`.

## Notes
- Profiles are not cross-linked for privacy.
- Docs are placeholders — do not upload real IDs to public hosting.
