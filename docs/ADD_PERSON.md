# Add a new person

This project uses path-based URLs:

- `/<person>/<profile>/`

## 1) Create data
Copy an existing folder and edit:

```
data/people/jatin  ->  data/people/rahul
```

Edit JSON files inside `data/people/rahul/`.

## 2) Create pages
Create folders and copy `index.html` from an existing profile.

Example:

```
rahul/job/index.html
rahul/docs/index.html
rahul/socialwork/index.html
```

## 3) Add landing entries
Edit `data/site/landing.json` and add the new person under the right groups.

## 4) Add files
Put resumes/docs/photos here:

- `assets/files/<person>/job/resume.pdf`
- `assets/files/<person>/docs/*.pdf`
- `assets/img/avatars/<person>.svg`
- `assets/img/gallery/<person>-1.svg` etc.

## Notes
- Profile pages do not link to each other (privacy).
- You can keep `marriage` pages unlisted by not adding them to landing.
