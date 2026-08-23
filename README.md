# Cheque Verification

A cheque identity verification application with a Next.js client and an Express server. The server sends cheque images to Google Gemini, compares the extracted identity fields with the user's profile, and returns the verification result.

## Requirements

- Node.js 18 or newer
- A Google Gemini API key

## Environment Variables

Create `server/.env`:

```env
GEMINI_API_KEY_1=your_gemini_api_key
```

The server also supports these optional variables:

```env
PORT=4000
MAX_UPLOAD_BYTES=8388608
GEMINI_MODEL=gemini-2.5-flash
CLIENT_ORIGIN=http://localhost:3000
```

Create `client/.env.local` if the API is not running at the default URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Additional keys can be configured as `GEMINI_API_KEY_2` through `GEMINI_API_KEY_5`. The server tries them in order when a request fails. Environment files are ignored by Git.

## Getting Started

Install dependencies in both applications:

```bash
cd server
npm install
cd ../client
npm install
```

Start the API server in one terminal:

```bash
cd server
npm run dev
```

Start the Next.js client in another terminal:

```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The API health check is available at [http://localhost:4000/health](http://localhost:4000/health).

## Available Scripts

Run these from the corresponding directory:

- From `client/`, `npm run dev` starts Next.js, `npm run build` creates a production build, `npm run start` serves it, and `npm run lint` checks the client code.
- From `server/`, `npm run dev` starts the API with file watching and `npm run start` starts the API in production mode.

## Current Storage

Profiles and verified cheque submissions currently use in-memory repositories for development. Data is lost when the server restarts.

## Project Structure

- `client/` contains the Next.js web application.
- `server/` contains the Express API and Gemini integration.
