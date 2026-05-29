# Lyric AF — Dynamic Lyric Video Generator

Template-based lyric video backend inspired by reusable After Effects workflows. Remotion handles motion and typography; FFmpeg handles audio mux and delivery encoding.

## Prerequisites

- Node.js 20+
- FFmpeg (`ffmpeg -version`)
- Docker (for Redis)

## Quick Start

```bash
# Install dependencies
npm install

# Start Redis
docker compose up -d

# Copy env and run all services
cp .env.example .env
npm run dev
```

Services:
- **API** — http://localhost:3100
- **Remotion Studio** — http://localhost:3001 (when started via `npm run dev -w @lyric-af/remotion`)

## API Examples

### List templates

```bash
curl http://localhost:3100/templates
```

### Upload an audio asset

```bash
curl -X POST http://localhost:3100/assets \
  -F "type=audio" \
  -F "file=@./your-song.mp3"
```

### Create a render job

```bash
curl -X POST http://localhost:3100/renders \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "00000000-0000-4000-8000-000000000001",
    "audioAssetId": "<audio-asset-id>",
    "lyrics": [
      { "text": "Hello", "startMs": 0, "endMs": 800 },
      { "text": "from", "startMs": 800, "endMs": 1400 },
      { "text": "the", "startMs": 1400, "endMs": 1800 },
      { "text": "other", "startMs": 1800, "endMs": 2400 },
      { "text": "side", "startMs": 2400, "endMs": 3200 }
    ],
    "overrides": {
      "primaryColor": "#ffffff",
      "secondaryColor": "#ffcc00"
    }
  }'
```

### Poll render status

```bash
curl http://localhost:3100/renders/<job-id>
```

When `status` is `completed`, `outputUrl` contains the rendered MP4.

### Register a custom template

```bash
curl -X POST http://localhost:3100/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Template",
    "compositionId": "KaraokeHighlight",
    "defaultParams": { "fontSize": 48 }
  }'
```

## Local render (no API)

Test Remotion templates directly:

```bash
npm run render:local -- KaraokeHighlight ./path/to/audio.mp3 ./storage/output.mp4
```

## Project Structure

```
apps/api/          Fastify REST API
apps/worker/       BullMQ render worker (Remotion + FFmpeg)
packages/schemas/  Zod types + Drizzle SQLite
packages/storage/  Local filesystem storage adapter
packages/ffmpeg/   FFmpeg mux/encode helpers
remotion/          Remotion compositions (KaraokeHighlight, ScrollLyrics)
```

## Default Templates

| ID | Composition | Description |
|----|-------------|-------------|
| `...0001` | KaraokeHighlight | Centered lyrics with active word highlight |
| `...0002` | ScrollLyrics | Vertical scroll with fade transitions |

## Environment Variables

See [`.env.example`](.env.example).

## Render Pipeline

1. Client submits timed lyrics + template + audio asset
2. API enqueues BullMQ job
3. Worker renders Remotion composition to raw MP4
4. FFmpeg muxes audio, encodes H.264/AAC, normalizes loudness
5. Final MP4 stored and served at `/files/...`
