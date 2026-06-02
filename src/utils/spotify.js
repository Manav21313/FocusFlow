const spotifyAccountsBase = 'https://accounts.spotify.com'
const spotifyApiBase = 'https://api.spotify.com/v1'
const spotifyTokenKey = 'focusflow_spotify_token'
const spotifyVerifierKey = 'focusflow_spotify_code_verifier'
const spotifyStateKey = 'focusflow_spotify_auth_state'

const spotifyScopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-playback-state',
  'user-modify-playback-state',
]

const placeholderSpotifyValues = new Set([
  'your_spotify_client_id',
  'your_spotify_app_client_id',
])

const normalizeEnvValue = (value) =>
  (value || '').trim().replace(/^['"]|['"]$/g, '')

const getDefaultSpotifyRedirectUri = () => {
  const { hostname, origin, port, protocol } = window.location

  if (hostname === 'localhost') {
    return `${protocol}//127.0.0.1${port ? `:${port}` : ''}/callback`
  }

  return `${origin}/callback`
}

export const spotifyClientId = normalizeEnvValue(
  import.meta.env.VITE_SPOTIFY_CLIENT_ID ||
    import.meta.env.VITE_SPOTIFY_APP_CLIENT_ID,
)

export const invalidSpotifyClientId =
  Boolean(spotifyClientId) && !/^[A-Za-z0-9]{32}$/.test(spotifyClientId)

export const missingSpotifyConfig =
  !spotifyClientId ||
  placeholderSpotifyValues.has(spotifyClientId) ||
  spotifyClientId.startsWith('your_') ||
  invalidSpotifyClientId

export const spotifyConfigMessage = invalidSpotifyClientId
  ? 'The Spotify client ID in .env is not valid. Use the 32-character Client ID from your Spotify app, not the client secret.'
  : 'Spotify is not configured. Add VITE_SPOTIFY_CLIENT_ID to .env and restart the dev server.'

export const getSpotifyRedirectUri = () =>
  normalizeEnvValue(import.meta.env.VITE_SPOTIFY_REDIRECT_URI) ||
  getDefaultSpotifyRedirectUri()

const createSpotifyError = (message) => {
  const error = new Error(message)
  error.safeMessage = message
  return error
}

const readJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const generateRandomString = (length) => {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = window.crypto.getRandomValues(new Uint8Array(length))

  return values.reduce(
    (accumulator, value) =>
      `${accumulator}${possible[value % possible.length]}`,
    '',
  )
}

const base64UrlEncode = (input) =>
  window
    .btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

const createCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)

  return base64UrlEncode(digest)
}

const getSpotifyResponseMessage = async (response) => {
  try {
    const payload = await response.json()

    return (
      payload?.error_description ||
      payload?.error?.message ||
      payload?.error ||
      `Spotify request failed with status ${response.status}.`
    )
  } catch {
    return `Spotify request failed with status ${response.status}.`
  }
}

const normalizeToken = (payload, previousToken = {}) => ({
  accessToken: payload.access_token,
  refreshToken: payload.refresh_token || previousToken.refreshToken || '',
  expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
  scope: payload.scope || previousToken.scope || '',
  tokenType: payload.token_type || previousToken.tokenType || 'Bearer',
})

export const loadSpotifyToken = () => readJson(spotifyTokenKey, null)

export const saveSpotifyToken = (token) => {
  if (!token?.accessToken) return

  writeJson(spotifyTokenKey, token)
}

export const clearSpotifyToken = () => {
  window.localStorage.removeItem(spotifyTokenKey)
  window.localStorage.removeItem(spotifyVerifierKey)
  window.localStorage.removeItem(spotifyStateKey)
}

export const isSpotifyCallback = () => {
  const params = new URLSearchParams(window.location.search)

  return params.has('code') || params.has('error')
}

export const clearSpotifyCallbackFromUrl = () => {
  const url = new URL(window.location.href)

  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`,
  )
}

export const beginSpotifyLogin = async () => {
  if (missingSpotifyConfig) {
    throw createSpotifyError(spotifyConfigMessage)
  }

  const codeVerifier = generateRandomString(96)
  const state = generateRandomString(32)
  const codeChallenge = await createCodeChallenge(codeVerifier)
  const authUrl = new URL(`${spotifyAccountsBase}/authorize`)

  window.localStorage.setItem(spotifyVerifierKey, codeVerifier)
  window.localStorage.setItem(spotifyStateKey, state)

  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: spotifyClientId,
    scope: spotifyScopes.join(' '),
    redirect_uri: getSpotifyRedirectUri(),
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  }).toString()

  window.location.assign(authUrl.toString())
}

export const consumeSpotifyCallback = async () => {
  const params = new URLSearchParams(window.location.search)

  if (!isSpotifyCallback()) return null

  const code = params.get('code')
  const error = params.get('error')
  const state = params.get('state')

  clearSpotifyCallbackFromUrl()

  if (error) {
    throw createSpotifyError(
      error === 'access_denied'
        ? 'Spotify sign-in was cancelled.'
        : `Spotify sign-in failed: ${error}.`,
    )
  }

  const storedState = window.localStorage.getItem(spotifyStateKey)
  const codeVerifier = window.localStorage.getItem(spotifyVerifierKey)

  if (!code || !codeVerifier || state !== storedState) {
    clearSpotifyToken()
    throw createSpotifyError('Spotify sign-in could not be verified.')
  }

  const response = await window.fetch(`${spotifyAccountsBase}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: spotifyClientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: getSpotifyRedirectUri(),
      code_verifier: codeVerifier,
    }),
  })

  window.localStorage.removeItem(spotifyVerifierKey)
  window.localStorage.removeItem(spotifyStateKey)

  if (!response.ok) {
    throw createSpotifyError(await getSpotifyResponseMessage(response))
  }

  const payload = await response.json()
  const token = normalizeToken(payload)

  saveSpotifyToken(token)
  return token
}

export const isSpotifyTokenExpired = (token) =>
  !token?.accessToken || Date.now() > token.expiresAt - 60_000

export const refreshSpotifyToken = async (token) => {
  if (!token?.refreshToken) {
    clearSpotifyToken()
    throw createSpotifyError('Spotify session expired. Sign in again.')
  }

  const response = await window.fetch(`${spotifyAccountsBase}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: spotifyClientId,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    }),
  })

  if (!response.ok) {
    clearSpotifyToken()
    throw createSpotifyError(await getSpotifyResponseMessage(response))
  }

  const payload = await response.json()
  const refreshedToken = normalizeToken(payload, token)

  saveSpotifyToken(refreshedToken)
  return refreshedToken
}

export const getValidSpotifyToken = async (token) => {
  if (!isSpotifyTokenExpired(token)) return token

  return refreshSpotifyToken(token)
}

const spotifyApiFetch = async (token, path, options = {}) => {
  const body =
    options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body
  const response = await window.fetch(`${spotifyApiBase}${path}`, {
    ...options,
    body,
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  if (!response.ok) {
    throw createSpotifyError(await getSpotifyResponseMessage(response))
  }

  return response.json()
}

export const fetchSpotifyProfile = (token) => spotifyApiFetch(token, '/me')

export const fetchCurrentUserPlaylists = async (token) => {
  const data = await spotifyApiFetch(token, '/me/playlists?limit=50')

  return data?.items || []
}

export const transferSpotifyPlayback = (token, deviceId) =>
  spotifyApiFetch(token, '/me/player', {
    method: 'PUT',
    body: {
      device_ids: [deviceId],
      play: false,
    },
  })

export const playSpotifyPlaylist = async (token, deviceId, playlistUri) => {
  await transferSpotifyPlayback(token, deviceId)

  return spotifyApiFetch(
    token,
    `/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: 'PUT',
      body: { context_uri: playlistUri },
    },
  )
}

export const setSpotifyShuffle = (token, shuffleEnabled) =>
  spotifyApiFetch(
    token,
    `/me/player/shuffle?state=${shuffleEnabled ? 'true' : 'false'}`,
    { method: 'PUT' },
  )

export const setSpotifyRepeat = (token, repeatState) =>
  spotifyApiFetch(
    token,
    `/me/player/repeat?state=${encodeURIComponent(repeatState)}`,
    { method: 'PUT' },
  )
