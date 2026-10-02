# SPIN DAT

A real DJ workstation prototype built with Next.js and the Web Audio API.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Current implementation

- Real audio engine using Web Audio API
- 8 persistent deck states
- Two visible decks for the main workstation layout
- Local track loading per deck
- Global waveform and deck waveform rendering from actual audio buffers
- Play/pause, cue, pitch, filter, EQ, volume, crossfader, meter simulation
- UI tuned toward the reference dark vinyl DJ booth aesthetic
