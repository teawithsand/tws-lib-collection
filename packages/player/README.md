# @teawithsand/player

Advanced audio player library using Valtio for state management.

## Features

- Manage playback state reactively with Valtio proxy.
- Support for multiple entries (audio sources) with seamless switching.
- Support for Blob and URL audio sources.
- Playback control: play/pause, seek, speed, volume, pitch preservation.
- Event system for playback events and errors.

## Installation

```bash
npm install @teawithsand/player
```

## Usage

```typescript
import { HTMLPlayer } from "@teawithsand/player"
import { PlayerEntryType } from "@teawithsand/player"

// Create an HTMLAudioElement
const audioElement = document.createElement("audio")
audioElement.preload = "auto"

// Create player instance
const player = new HTMLPlayer(audioElement)

// Set entries (audio sources)
player.setEntries([
  { type: PlayerEntryType.URL, url: "https://example.com/audio1.mp3" },
  { type: PlayerEntryType.BLOB, blob: someBlob },
])

// Play
player.setUserWantsToPlay(true)

// Listen to events
player.on("entry-ended", () => {
  console.log("Entry ended")
})

player.on("error", (e) => {
  console.error("Playback error", e.error)
})

// Control playback
player.seek(30) // seek to 30 seconds
player.setSpeed(1.5) // 1.5x speed
player.setVolume(0.5) // 50% volume
player.setPreservePitchForSpeed(true) // preserve pitch

// Access state
console.log(player.state.isPlaying)
console.log(player.state.currentEntryPosition)

// player.state is valtio-managed proxy; you can useSnapshot/subscribe on it.
```

## API

See the `Player` interface and `HTMLPlayer` class for full API details.

## Development

Run tests with:

```bash
npm run test
```

Format and lint with:

```bash
npm run fix
```

## License

MIT
