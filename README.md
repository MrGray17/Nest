# Nest

Nest is a local-first focus room: choose a place, bring a YouTube soundtrack, pick one task, and stay with it.

The V1 experience includes three original animated environments, YouTube video/playlist/live-stream playback, a timestamp-based focus timer, independent synthesized ambience, Focus/Immersive/Watch layouts, saved spaces, a gentle break flow, simple history, fullscreen, idle chrome, and offline-capable PWA assets.

## Run locally

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run test
npm run typecheck
npm run build
npm run preview
```

No environment variables, API keys, account, or backend are required. YouTube playback requires an internet connection.

## Architecture

```text
src/
  audio/          Web Audio engine and pure ambient-mix rules
  components/     Focus-room presentation and focused side panels
  config/         Data-driven definitions for the three environments
  domain/         Product types, timer math, and YouTube URL parsing
  hooks/          Thin React lifecycle adapters
  persistence/    Versioned IndexedDB repository and legacy migration
  services/       YouTube IFrame API adapter
  state/          Pure application mutations for sessions and saved data
  styles/         Visual foundation, layered scenes, and room states
public/
  assets/scenes/  Original optimized environment backplates
  icons/          Raster PWA install icons
```

The dependency direction is deliberate: UI composes domain operations and adapters; domain logic does not import React, browser storage, Web Audio, or YouTube. IndexedDB is the single persistence boundary. YouTube API calls and audio-node ownership each live behind one service.

## Local data

Nest stores one versioned V2 record in IndexedDB (`nest-local`). It contains:

- current task, room, layout, timer preference, and volumes
- named YouTube sources
- saved spaces
- active session and break state
- session history and optional completion notes

On first launch, the repository migrates compatible timer/history data from the older `nest.*.v1` localStorage keys. Timer calculations use timestamps and accumulated paused time, so throttled or background tabs do not cause countdown drift. Persisted recovery snapshots are paused: if Nest is closed or crashes, reopening never counts time spent away as focus time.

## PWA installation

Run the production build over HTTPS (or localhost), then use the browser's **Install Nest** action. The application shell, icons, and all three environment backplates are precached. YouTube still requires connectivity; synthesized room ambience does not.

## Assets and licensing

See [public/assets/ASSETS.md](public/assets/ASSETS.md). All three scene backplates were created specifically for Nest and are not copied from existing anime or other artwork. The interface uses Lucide icons under the ISC license. The app otherwise relies on system fonts and contains no third-party photo, audio, or video files.

## Keyboard and access

- `Space`: pause or resume an active focus session
- `M`: open music
- `S`: open the sound mixer
- `Esc`: close a side panel

Controls have visible keyboard focus states, scene motion respects reduced-motion preferences, and essential controls remain labeled for assistive technology.

## Known limitations

- YouTube availability, embedding permissions, ads, and region restrictions are controlled by YouTube.
- Browser autoplay policy may require pressing play in the embedded player or enabling ambience once.
- Data is intentionally local to the current browser profile and is not cloud-synced.
- Ambient channels are lightweight procedural sound beds, not field recordings.
