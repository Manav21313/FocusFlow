# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Spotify playback

FocusFlow can stream a signed-in user's Spotify playlists on the timer page. Create a Spotify app in the Spotify Developer Dashboard, add your local redirect URI to the app allowlist, then set:

```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

Browser playback uses Spotify OAuth with PKCE and the Spotify Web Playback SDK. The signed-in Spotify account must have Premium for in-browser streaming.

The dev server is pinned to `http://127.0.0.1:5173` so the Spotify callback does not drift to another port. If `npm run dev` says the port is busy, stop the existing Vite server before signing in with Spotify.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
