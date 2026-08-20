# Asset register

## Original Nest scene art

The following backplates were generated specifically for this repository with OpenAI's built-in image generation tool on 2026-08-20, then converted locally to optimized JPEG files. They are original prompts and do not use copyrighted characters, screenshots, logos, or reference artwork.

- `scenes/tokyo-cafe.jpg` — original café environment
- `scenes/summer-sunset.jpg` — original coastal summer room environment
- `scenes/late-night.jpg` — original coding room environment

## Authored time-of-day art

Each room now has four hand-authored transparent SVG art layers under `scenes/time/`: dawn, day, sunset, and night. These are not generic full-screen color filters. Each file redraws the room's exterior zone — sky, horizon/city massing, daylight direction, sun/moon glow, and night lights — while leaving the room identity and furniture stable.

- `time/tokyo-*.svg` — Tokyo window/city light states
- `time/summer-*.svg` — coastal sky, sea, horizon, sun/moon states
- `time/coding-*.svg` — coding-room window/city light states

`EnvironmentScene` composes the stable JPEG backplate + the selected SVG time art + weather. Arrival cards use the same time art, so the preview and entered room stay visually consistent.

Weather remains independent: rain, fog, snow, storm, clouds, wet sheen, and lightning are separate exterior-only HTML/CSS layers. This means a clear afternoon, rainy afternoon, clear night, and rainy night all use the same physical room without baking weather into the time artwork.

The visible rivulets, steam, traffic light, clouds, curtains, foliage, petals, monitor glow, city lights, and sleep-breath effects are separate HTML/CSS animation layers implemented in `src/components/EnvironmentScene.tsx`, `src/styles/scenes.css`, `src/styles/time-art.css`, and `src/styles/atmosphere.css`.

## Interface assets

- `../nest.svg`, `../icons/nest-192.png`, and `../icons/nest-512.png` are original Nest brand assets created for this repository.
- Interface symbols come from `lucide-react`, distributed under the ISC license: https://lucide.dev/license

Nest ships no third-party photographs, music, field recordings, video files, or font files. YouTube media is embedded at runtime from URLs the local user supplies.
