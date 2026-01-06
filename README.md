# multi-profile-static-site

A **fully static**, data-driven website that supports **multiple people** and **multiple profile types** from one codebase:

- People: **2 included** (Jatin, Nitin) — add more easily
- Profiles per person: **Professional**, **Marriage**, **Business**
- Same template/UI for all profiles
- Profile + section toggles in JSON
- Works on **GitHub Pages** and **local server**
- Built-in **Light/Dark mode** toggle

## Run locally

> Browsers often block `fetch()` from `file://` URLs, so use a tiny local server.

```bash
python3 -m http.server 8080
```

Open:

- http://localhost:8080/?person=jatin&profile=professional
- http://localhost:8080/?person=jatin&profile=marriage
- http://localhost:8080/?person=jatin&profile=business
- http://localhost:8080/?person=nitin&profile=professional
- http://localhost:8080/?person=nitin&profile=marriage
- http://localhost:8080/?person=nitin&profile=business

## Deploy on GitHub Pages

1. Create a GitHub repo (example: `multi-profile-static-site`)
2. Push all files to `main`
3. GitHub → **Settings → Pages**
4. Deploy from branch: `main` / `(root)`
5. Use URLs like:

- `https://<user>.github.io/<repo>/?person=jatin&profile=professional`

## Where to edit

### Toggle people/profiles
`config/site.json`

- Disable a person:
```json
"nitin": { "enabled": false }
```

- Disable a profile for one person:
```json
"marriage": { "enabled": false }
```

### Edit content (data is separated per person)
- `data/people/jatin/*.json`
- `data/people/nitin/*.json`

Each profile JSON is structured as **sections** (key-value cards):

```json
{
  "headline": "Short subtitle",
  "sections": [
    {
      "title": "About",
      "visible": true,
      "kind": "keyValue",
      "content": {
        "Name": "Your Name",
        "Role": "Your Role"
      }
    }
  ]
}
```

### Resume PDFs
Replace the sample resumes:

- `assets/resume/jatin_resume.pdf`
- `assets/resume/nitin_resume.pdf`

## Add a 3rd person (example)

1. Create folder: `data/people/alex/`
2. Copy 3 JSON files into it
3. Update `config/site.json`:

```json
"alex": {
  "label": "Alex",
  "enabled": true,
  "profiles": {
    "professional": { "enabled": true, "dataFile": "data/people/alex/professional.json" },
    "marriage":      { "enabled": true, "dataFile": "data/people/alex/marriage.json" },
    "business":      { "enabled": true, "dataFile": "data/people/alex/business.json" }
  }
}
```

Done ✅
