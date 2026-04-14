# PhotoBooth Strip Maker

A full-stack web app that captures webcam photos and turns them into a classic photobooth strip PNG.

## Features

- Webcam live preview via MediaDevices API
- Optional 3-second capture countdown
- Choose strip layout: 3 or 4 photos
- Per-photo effects:
  - Original
  - Vintage
  - Black & White
- Flash animation + shutter sound on capture
- Server-side strip generation with Sharp:
  - Fixed output width
  - Uniform image sizing
  - Equal spacing
  - White border
  - Bottom text tab (always preserved, optional text)
- Download high-quality PNG
- Responsive dark-theme UI
- Error handling for denied camera access

## Tech Stack

### Frontend (`client`)

- React + Vite + TypeScript
- TailwindCSS
- Canvas API for frame capture and preview processing

### Backend (`server`)

- Node.js + Express + TypeScript
- Sharp for image composition and filtering
- Multer (multipart support)
- CORS + dotenv

## Project Structure

```text
photo-strip-app/
  client/
  server/
```

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

### 1. Install dependencies

From the project root:

```bash
cd photo-strip-app
npm install
npm run install:all
```

### 2. Configure environment

Server:

```bash
cp server/.env.example server/.env
```

Client:

```bash
cp client/.env.example client/.env
```

## Run in Development

From `photo-strip-app` root:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Build for Production

From `photo-strip-app` root:

```bash
npm run build
```

Then start backend from the server package:

```bash
cd server
npm run start
```

Serve frontend build from `client/dist` using your preferred static host.

## API

### `GET /health`

Returns service health status.

### `POST /generate-strip`

Accepts JSON or multipart form fields.

Request JSON:

```json
{
  "photos": ["data:image/jpeg;base64,...", "..."],
  "filters": ["original", "vintage", "bw"],
  "text": "Best Day Ever",
  "layout": 3
}
```

Response:

- `200 OK`
- `image/png` binary (download-ready strip)

## Notes

- Images are processed in memory only (temporary local processing).
- No database or persistent image storage is used.
