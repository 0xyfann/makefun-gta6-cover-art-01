# Afterglow Cover Studio

A local-first cover art editor for turning your own photos into vivid multi-frame night-drive posters. Add photos, assign them to story frames, adjust the title and color treatment, then export a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080. Images stay in your browser; there is no upload or external request.

[![make.fun competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Live repository rank](https://make.fun/badge/gta6-cover-art-01/0xyfann/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Live repository reward](https://make.fun/badge/gta6-cover-art-01/0xyfann/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

## Run locally

Serve the `app/` directory with any static server. With Node 22:

```sh
node serve.ts
```

Open http://localhost:8080. The starter photos are included for trying the editor; add any local image with **Add photos**. Select an image per frame and drag across the cover preview to adjust its crop. Export writes a PNG directly from the canvas.

The app is original artwork and does not use Rockstar marks, game artwork or game fonts. Archivo is distributed under the SIL Open Font License; its license is included in `app/fonts/`.

## Build dossier

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Editing and verification

Each frame has its own crop: select it in the preview or frame list, adjust the zoom slider, and drag the image. **Center** resets the selected frame; the reset icon resets all frames. Add or remove frames to make layouts with one to five photos. You can reuse one photo with a different crop in every frame. Invalid image files leave the current cover intact.

The three share formats export full resolution, independently of the smaller live preview. Titles, sunset/neon/noir treatments and display lettering are rendered into the PNG. The four images in `screenshots/` are fresh Chromium captures of the editor and actual downloaded exports.

See [VERIFICATION.md](VERIFICATION.md) for measured limits, deterministic build results and repeatable browser checks. Browser automation dependencies are development tools only and are excluded from the app and generated output.

MIT licensed. [Competition brief](https://make.fun/bounty/gta6-cover-art-01).

---

Built with make.fun: https://make.fun/r/p1x954ca
