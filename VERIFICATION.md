# Round 2 completion checks

The existing editor was run in Chromium before revision. The follow-up edits fixed export resolution, independent frame positioning, overlapping four/five-frame layouts, unsafe filename interpolation, upload assignment and title sizing. The revised app was run again before the final build checks. Kit-owned files, sample images and the existing OFL font/license were preserved.

## Browser checks

Chromium headless shell 145, automated with Playwright 1.58.2:

- Two local image files loaded and assigned to separate frames.
- Caption edits changed the canvas; the character counter matched the input.
- Zoom and actual pointer dragging changed the cover. Clicking the hero frame selected frame 1; reset restored crops.
- Adding frames reached five, disabled the add control, and removing frames returned to three.
- Sunset, neon, noir and both typography controls responded.
- PNG downloads were decoded from their actual files: 1920 × 1080 (2,357,396 bytes), 1080 × 1350 (1,941,507 bytes), 1080 × 1080 (1,597,665 bytes).
- An export also completed after the browser context was set offline.
- A 390 × 844 viewport had no horizontal overflow. Empty titles and an unreadable image file were handled.
- Zero requests to external origins, zero uncaught exceptions and zero console errors. Initial HTTP requests only loaded this app's local static files; photos added through the input remained local blob URLs.

## Fresh screenshots

All four JPEGs were captured directly in headless Chromium without later image editing. Export screenshots display the app's actual downloaded PNG using a data URI, fitted in the browser viewport.

| File | Dimensions | Bytes |
| --- | --- | ---: |
| `00-cover-landscape.jpg` | 1280 × 720 | 132,514 |
| `01-editor-loaded.jpg` | 1280 × 1100 | 151,771 |
| `02-export-portrait.jpg` | 864 × 1080 | 145,031 |
| `03-export-square.jpg` | 1080 × 1080 | 179,574 |

Each image is below 256 KiB, has a long side no greater than 1280, and a short side at least 480. The first image by name is the landscape export.

## Output checks

`MAKEFUN_OUTPUT_DIR=out node main.ts` was executed twice. A SHA-256 manifest of every output file matched exactly between runs. The dossier also matched an independent call to the unchanged kit `buildDossier` function.

- App: 8 files and 3 directories; 11 entries total; 810,476 bytes.
- `index.html`: 4,427 bytes.
- Dossier: 842,367 bytes, 4 images, cover index 0.
- Dossier SHA-256: `d90612642b66e07591e58f6eba6eab0a716e2310a6ba79174f166bc80599a0f4`.
- Full output: 13 files, 2,261,733 bytes; no symlinks.
- `node --check app/src/studio.js` and the staged whitespace check for authored files passed. The unchanged upstream OFL license retains one trailing space on its original line 21; the whitespace check excludes that license file.
- All executable HTML/CSS/JS asset references are local files or data/blob URLs. Upstream URLs in the unmodified OFL license are attribution text and are never requested by the app.

The application has no package dependency or build step. The entrypoint uses Node standard-library modules and the kit vendor file. The two-run check passed first with the session default Node v24.22.1, then twice again with Node v22.23.5. Every output file also matched across the two Node versions.

## Reproduce

Keep `node serve.ts` running in a separate terminal. Install the optional test tooling outside both `app/` and the output directory:

```sh
npm install --prefix .verification/browser-tools --cache .verification/npm-cache playwright@1.58.2
PLAYWRIGHT_BROWSERS_PATH="$PWD/.verification/browser-tools/browsers" .verification/browser-tools/node_modules/.bin/playwright install chromium
node tools/verify-browser.mjs
MAKEFUN_OUTPUT_DIR=out node main.ts
node tools/verify-output.mjs --baseline
MAKEFUN_OUTPUT_DIR=out node main.ts
node tools/verify-output.mjs
```

Set `CHROMIUM_PATH` to use another compatible headless Chromium executable. Detailed JSON reports and full-size downloaded PNGs are retained under ignored `.verification/verification/`. Browser dependencies, caches and output are ignored by Git and are not copied by `main.ts`.
