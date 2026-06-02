import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import {
  beginSpotifyLogin,
  clearSpotifyToken,
  consumeSpotifyCallback,
  fetchCurrentUserPlaylists,
  fetchSpotifyProfile,
  getValidSpotifyToken,
  loadSpotifyToken,
  missingSpotifyConfig,
  playSpotifyPlaylist,
  setSpotifyRepeat,
  setSpotifyShuffle,
  spotifyConfigMessage,
} from '../utils/spotify'

const sdkSource = 'https://sdk.scdn.co/spotify-player.js'
let spotifySdkPromise = null
let sharedSpotifyToken = null
let sharedSpotifyPlayer = null
let sharedSpotifyDeviceId = ''
let sharedSpotifyPlayback = null
let sharedSpotifyStatusText = ''
let sharedSpotifyError = ''
const sharedSpotifySubscribers = new Set()

const getSafeMessage = (error) =>
  error?.safeMessage || error?.message || 'Spotify is unavailable right now.'

const formatPlaybackTime = (milliseconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const repeatStateByMode = {
  0: 'off',
  1: 'context',
  2: 'track',
}

const getNextRepeatMode = (repeatMode) =>
  repeatMode === 0 ? 1 : repeatMode === 1 ? 2 : 0

const getPlaybackFromState = (state) => {
  if (!state) return null

  const currentTrack = state.track_window?.current_track

  return {
    paused: state.paused,
    currentTrack: currentTrack
      ? {
          name: currentTrack.name,
          artists:
            currentTrack.artists
              ?.map((artist) => artist.name)
              .filter(Boolean)
              .join(', ') || '',
          image: currentTrack.album?.images?.[0]?.url || '',
        }
      : null,
    durationMs: state.duration || 0,
    positionMs: state.position || 0,
    repeatMode: state.repeat_mode || 0,
    shuffle: Boolean(state.shuffle),
  }
}

const publishSharedSpotifyState = () => {
  const snapshot = {
    deviceId: sharedSpotifyDeviceId,
    error: sharedSpotifyError,
    playback: sharedSpotifyPlayback,
    statusText: sharedSpotifyStatusText,
  }

  sharedSpotifySubscribers.forEach((subscriber) => subscriber(snapshot))
}

const subscribeToSharedSpotifyState = (subscriber) => {
  sharedSpotifySubscribers.add(subscriber)
  subscriber({
    deviceId: sharedSpotifyDeviceId,
    error: sharedSpotifyError,
    playback: sharedSpotifyPlayback,
    statusText: sharedSpotifyStatusText,
  })

  return () => {
    sharedSpotifySubscribers.delete(subscriber)
  }
}

const setSharedSpotifyPlayback = (updater) => {
  sharedSpotifyPlayback =
    typeof updater === 'function' ? updater(sharedSpotifyPlayback) : updater
  publishSharedSpotifyState()
}

const getSharedSpotifyToken = async () => {
  const nextToken = await getValidSpotifyToken(
    sharedSpotifyToken || loadSpotifyToken(),
  )

  sharedSpotifyToken = nextToken
  return nextToken
}

const loadSpotifySdk = () => {
  if (window.Spotify?.Player) {
    return Promise.resolve(window.Spotify)
  }

  if (spotifySdkPromise) return spotifySdkPromise

  spotifySdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${sdkSource}"]`)
    const previousReady = window.onSpotifyWebPlaybackSDKReady

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (typeof previousReady === 'function') {
        previousReady()
      }

      resolve(window.Spotify)
    }

    if (existingScript) return

    const script = document.createElement('script')
    script.src = sdkSource
    script.async = true
    script.onerror = () => {
      spotifySdkPromise = null
      reject(new Error('Spotify player could not load.'))
    }
    document.body.appendChild(script)
  })

  return spotifySdkPromise
}

const syncSharedPlaybackFromPlayer = async () => {
  if (!sharedSpotifyPlayer?.getCurrentState) return

  try {
    const state = await sharedSpotifyPlayer.getCurrentState()

    if (state) {
      sharedSpotifyPlayback = getPlaybackFromState(state)
      publishSharedSpotifyState()
    }
  } catch {
    // The SDK can reject briefly while a device is switching.
  }
}

const connectSharedSpotifyPlayer = async () => {
  if (sharedSpotifyPlayer) {
    await syncSharedPlaybackFromPlayer()
    return sharedSpotifyPlayer
  }

  await loadSpotifySdk()

  const player = new window.Spotify.Player({
    name: 'FocusFlow Player',
    volume: 0.45,
    getOAuthToken: (callback) => {
      getSharedSpotifyToken()
        .then((validToken) => callback(validToken.accessToken))
        .catch((error) => {
          sharedSpotifyError = getSafeMessage(error)
          publishSharedSpotifyState()
        })
    },
  })

  sharedSpotifyPlayer = player

  player.addListener('ready', ({ device_id }) => {
    sharedSpotifyDeviceId = device_id
    sharedSpotifyStatusText = 'Browser player ready.'
    sharedSpotifyError = ''
    publishSharedSpotifyState()
  })

  player.addListener('not_ready', () => {
    sharedSpotifyDeviceId = ''
    sharedSpotifyStatusText = 'Browser player disconnected.'
    publishSharedSpotifyState()
  })

  player.addListener('player_state_changed', (state) => {
    if (!state) return

    sharedSpotifyPlayback = getPlaybackFromState(state)
    publishSharedSpotifyState()
  })

  player.addListener('initialization_error', ({ message }) => {
    sharedSpotifyError = message
    publishSharedSpotifyState()
  })

  player.addListener('authentication_error', ({ message }) => {
    sharedSpotifyError = message
    publishSharedSpotifyState()
  })

  player.addListener('account_error', ({ message }) => {
    sharedSpotifyError = `${message} Spotify Premium is required for browser playback.`
    publishSharedSpotifyState()
  })

  const connected = await player.connect()

  if (!connected) {
    sharedSpotifyError = 'Spotify player could not connect in this browser.'
    publishSharedSpotifyState()
  }

  return player
}

function SpotifyPanel() {
  const [token, setToken] = useState(null)
  const [profile, setProfile] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylistUri, setSelectedPlaylistUri] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [playback, setPlayback] = useState(null)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [playerLoading, setPlayerLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [seekDraftMs, setSeekDraftMs] = useState(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [spotifyError, setSpotifyError] = useState('')
  const [statusText, setStatusText] = useState('')
  const playerRef = useRef(null)
  const tokenRef = useRef(null)

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.uri === selectedPlaylistUri),
    [playlists, selectedPlaylistUri],
  )
  const isConnected = Boolean(token?.accessToken)
  const isPlaying = Boolean(playback && !playback.paused)
  const isPlaybackPaused = playback?.paused ?? true
  const playbackDurationMs = playback?.durationMs || 0
  const coverUrl =
    playback?.currentTrack?.image ||
    selectedPlaylist?.images?.[0]?.url ||
    profile?.images?.[0]?.url

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  const ensureToken = useCallback(async () => {
    sharedSpotifyToken = tokenRef.current || sharedSpotifyToken
    const nextToken = await getSharedSpotifyToken()

    tokenRef.current = nextToken
    setToken(nextToken)

    return nextToken
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootSpotify = async () => {
      try {
        const callbackToken = await consumeSpotifyCallback()
        const storedToken = callbackToken || loadSpotifyToken()

        if (!cancelled && storedToken?.accessToken) {
          sharedSpotifyToken = storedToken
          setToken(storedToken)
          setStatusText(callbackToken ? 'Spotify connected.' : '')
        }
      } catch (error) {
        if (!cancelled) {
          clearSpotifyToken()
          setSpotifyError(getSafeMessage(error))
        }
      }
    }

    bootSpotify()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return subscribeToSharedSpotifyState((state) => {
      setDeviceId(state.deviceId)
      setPlayback(state.playback)
      setStatusText(state.statusText)

      if (state.error) {
        setSpotifyError(state.error)
      }
    })
  }, [])

  useEffect(() => {
    if (!token?.accessToken) return undefined

    let cancelled = false

    const loadLibrary = async () => {
      setLibraryLoading(true)
      setSpotifyError('')

      try {
        const validToken = await ensureToken()
        const [nextProfile, nextPlaylists] = await Promise.all([
          fetchSpotifyProfile(validToken),
          fetchCurrentUserPlaylists(validToken),
        ])

        if (cancelled) return

        setProfile(nextProfile)
        setPlaylists(nextPlaylists)
        setSelectedPlaylistUri((currentUri) =>
          currentUri || nextPlaylists[0]?.uri || '',
        )
      } catch (error) {
        if (!cancelled) {
          setSpotifyError(getSafeMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLibraryLoading(false)
        }
      }
    }

    loadLibrary()

    return () => {
      cancelled = true
    }
  }, [ensureToken, token?.accessToken])

  useEffect(() => {
    if (!token?.accessToken) return undefined

    let cancelled = false

    const connectPlayer = async () => {
      setPlayerLoading(!sharedSpotifyPlayer)
      setSpotifyError('')

      try {
        sharedSpotifyToken = token
        const player = await connectSharedSpotifyPlayer()

        if (!cancelled) {
          playerRef.current = player
        }
      } catch (error) {
        if (!cancelled) {
          setSpotifyError(getSafeMessage(error))
        }
      } finally {
        if (!cancelled) {
          setPlayerLoading(false)
        }
      }
    }

    connectPlayer()

    return () => {
      cancelled = true
      playerRef.current = null
    }
  }, [token])

  useEffect(() => {
    if (isPlaybackPaused || isSeeking || !playbackDurationMs) return undefined

    const progressTimer = window.setInterval(() => {
      setSharedSpotifyPlayback((currentPlayback) => {
        if (
          !currentPlayback ||
          currentPlayback.paused ||
          !currentPlayback.durationMs
        ) {
          return currentPlayback
        }

        return {
          ...currentPlayback,
          positionMs: Math.min(
            currentPlayback.durationMs,
            currentPlayback.positionMs + 1000,
          ),
        }
      })
    }, 1000)

    return () => window.clearInterval(progressTimer)
  }, [isPlaybackPaused, isSeeking, playbackDurationMs])

  const signInToSpotify = async () => {
    setSpotifyError('')
    setStatusText('')

    try {
      await beginSpotifyLogin()
    } catch (error) {
      setSpotifyError(getSafeMessage(error))
    }
  }

  const disconnectSpotify = () => {
    clearSpotifyToken()
    sharedSpotifyToken = null

    if (sharedSpotifyPlayer) {
      sharedSpotifyPlayer.disconnect()
    }

    sharedSpotifyPlayer = null
    sharedSpotifyDeviceId = ''
    sharedSpotifyPlayback = null
    sharedSpotifyStatusText = ''
    sharedSpotifyError = ''
    publishSharedSpotifyState()

    setToken(null)
    setProfile(null)
    setPlaylists([])
    setSelectedPlaylistUri('')
    setDeviceId('')
    setPlayback(null)
    setSpotifyError('')
    setStatusText('')
  }

  const playSelectedPlaylist = async () => {
    if (!selectedPlaylistUri || !deviceId) return

    setActionLoading(true)
    setSpotifyError('')

    try {
      await playerRef.current?.activateElement?.()
      const validToken = await ensureToken()
      await playSpotifyPlaylist(validToken, deviceId, selectedPlaylistUri)
      setStatusText('Playing in FocusFlow.')
    } catch (error) {
      setSpotifyError(getSafeMessage(error))
    } finally {
      setActionLoading(false)
    }
  }

  const runPlayerAction = async (action, nextStatus) => {
    if (!playerRef.current) return

    setActionLoading(true)
    setSpotifyError('')

    try {
      await playerRef.current.activateElement?.()
      await action(playerRef.current)
      setStatusText(nextStatus)
    } catch (error) {
      setSpotifyError(getSafeMessage(error))
    } finally {
      setActionLoading(false)
    }
  }

  const seekPlayback = async (positionMs) => {
    const nextPositionMs = Number(
      positionMs ?? seekDraftMs ?? playback?.positionMs ?? 0,
    )

    setIsSeeking(false)
    setSeekDraftMs(null)
    setSharedSpotifyPlayback((currentPlayback) =>
      currentPlayback
        ? {
            ...currentPlayback,
            positionMs: nextPositionMs,
          }
        : currentPlayback,
    )

    if (!playerRef.current) return

    try {
      await playerRef.current.seek(nextPositionMs)
    } catch (error) {
      setSpotifyError(getSafeMessage(error))
    }
  }

  const toggleShuffle = async () => {
    if (!deviceId) return

    const nextShuffle = !playback?.shuffle

    setActionLoading(true)
    setSpotifyError('')

    try {
      const validToken = await ensureToken()
      await setSpotifyShuffle(validToken, nextShuffle)
      setSharedSpotifyPlayback((currentPlayback) =>
        currentPlayback
          ? {
              ...currentPlayback,
              shuffle: nextShuffle,
            }
          : currentPlayback,
      )
      setStatusText(nextShuffle ? 'Shuffle on.' : 'Shuffle off.')
    } catch (error) {
      setSpotifyError(getSafeMessage(error))
    } finally {
      setActionLoading(false)
    }
  }

  const toggleRepeat = async () => {
    if (!deviceId) return

    const nextRepeatMode = getNextRepeatMode(playback?.repeatMode || 0)

    setActionLoading(true)
    setSpotifyError('')

    try {
      const validToken = await ensureToken()
      await setSpotifyRepeat(validToken, repeatStateByMode[nextRepeatMode])
      setSharedSpotifyPlayback((currentPlayback) =>
        currentPlayback
          ? {
              ...currentPlayback,
              repeatMode: nextRepeatMode,
            }
          : currentPlayback,
      )
      setStatusText(
        nextRepeatMode === 0
          ? 'Repeat off.'
          : nextRepeatMode === 1
            ? 'Repeating playlist.'
            : 'Repeating track.',
      )
    } catch (error) {
      setSpotifyError(getSafeMessage(error))
    } finally {
      setActionLoading(false)
    }
  }

  const accountLabel = profile?.display_name || profile?.email || 'Spotify'
  const durationMs = playbackDurationMs
  const displayPositionMs = isSeeking
    ? seekDraftMs || 0
    : Math.min(playback?.positionMs || 0, durationMs)
  const seekProgress = durationMs ? (displayPositionMs / durationMs) * 100 : 0
  const repeatMode = playback?.repeatMode || 0
  const nowPlayingTitle =
    playback?.currentTrack?.name ||
    selectedPlaylist?.name ||
    (isConnected ? 'Choose a playlist' : 'Spotify playlists')
  const nowPlayingDetail =
    playback?.currentTrack?.artists ||
    selectedPlaylist?.owner?.display_name ||
    'Connect your account'
  const playerStatus = playerLoading
    ? 'Connecting browser player.'
    : deviceId
      ? statusText || 'Browser player ready.'
      : 'Device not found.'
  const playerStatusHint =
    !playerLoading && !deviceId
      ? 'Open Spotify on your device, start playing once, then try again.'
      : ''
  const spotifyErrorHint = /device|not found/i.test(spotifyError)
    ? 'Open Spotify on your device, start playing once, then try again.'
    : ''

  return (
    <section className="panel spotify-panel" aria-label="Spotify playlist player">
      <div className="panel-heading spotify-heading">
        <div>
          <p className="eyebrow">Spotify</p>
          <h2>Focus soundtrack</h2>
        </div>
        <span className={isConnected ? 'spotify-account-pill' : 'timer-status'}>
          {isConnected ? accountLabel : 'Not connected'}
        </span>
      </div>

      {missingSpotifyConfig ? (
        <div className="spotify-empty-state" role="status">
          <strong>Spotify setup required</strong>
          <span>{spotifyConfigMessage}</span>
        </div>
      ) : !isConnected ? (
        <div className="spotify-connect-block">
          <div>
            <strong>Stream playlists in FocusFlow.</strong>
            <span>Sign in with a Premium Spotify account.</span>
          </div>
          <button className="spotify-button" type="button" onClick={signInToSpotify}>
            Sign in with Spotify
          </button>
        </div>
      ) : (
        <div className="spotify-player-grid">
          <div className="spotify-now-playing">
            {coverUrl ? (
              <img src={coverUrl} alt="" />
            ) : (
              <span className="spotify-cover-placeholder">SP</span>
            )}
            <div className="spotify-track-copy">
              <span>{isPlaying ? 'Playing now' : 'Ready'}</span>
              <strong>{nowPlayingTitle}</strong>
              <p>{nowPlayingDetail}</p>
            </div>
          </div>

          <div className="spotify-library-column">
            <label className="field spotify-playlist-field">
              <span>Playlist</span>
              <select
                value={selectedPlaylistUri}
                onChange={(event) => setSelectedPlaylistUri(event.target.value)}
                disabled={libraryLoading || playlists.length === 0}
              >
                {libraryLoading ? <option>Loading playlists...</option> : null}
                {!libraryLoading && playlists.length === 0 ? (
                  <option>No playlists found</option>
                ) : null}
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.uri}>
                    {playlist.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="spotify-button spotify-playlist-button"
              type="button"
              onClick={playSelectedPlaylist}
              disabled={!selectedPlaylistUri || !deviceId || actionLoading}
            >
              {actionLoading ? 'Opening...' : 'Play playlist'}
            </button>
          </div>

          <div className="spotify-control-bar" aria-label="Music controls">
            <div className="spotify-control-buttons">
              <button
                className={playback?.shuffle ? 'active' : ''}
                type="button"
                onClick={toggleShuffle}
                disabled={!deviceId || actionLoading}
                aria-label={playback?.shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
                title={playback?.shuffle ? 'Shuffle off' : 'Shuffle on'}
              >
                <Shuffle aria-hidden="true" size={18} strokeWidth={2.35} />
              </button>
              <button
                type="button"
                onClick={() =>
                  runPlayerAction(
                    (player) => player.previousTrack(),
                    'Previous track.',
                  )
                }
                disabled={!deviceId || actionLoading}
                aria-label="Previous track"
                title="Previous"
              >
                <SkipBack aria-hidden="true" size={20} strokeWidth={2.25} />
              </button>
              <button
                className="spotify-play-toggle"
                type="button"
                onClick={() =>
                  runPlayerAction(
                    (player) => player.togglePlay(),
                    isPlaying ? 'Paused.' : 'Resumed.',
                  )
                }
                disabled={!deviceId || actionLoading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause aria-hidden="true" size={24} strokeWidth={2.5} />
                ) : (
                  <Play
                    aria-hidden="true"
                    fill="currentColor"
                    size={24}
                    strokeWidth={2.5}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  runPlayerAction((player) => player.nextTrack(), 'Next track.')
                }
                disabled={!deviceId || actionLoading}
                aria-label="Next track"
                title="Next"
              >
                <SkipForward aria-hidden="true" size={20} strokeWidth={2.25} />
              </button>
              <button
                className={repeatMode > 0 ? 'active' : ''}
                type="button"
                onClick={toggleRepeat}
                disabled={!deviceId || actionLoading}
                aria-label={
                  repeatMode === 0
                    ? 'Turn repeat on'
                    : repeatMode === 1
                      ? 'Repeat one track'
                      : 'Turn repeat off'
                }
                title={
                  repeatMode === 0
                    ? 'Repeat'
                    : repeatMode === 1
                      ? 'Repeat one'
                      : 'Repeat off'
                }
              >
                {repeatMode === 2 ? (
                  <Repeat1 aria-hidden="true" size={18} strokeWidth={2.35} />
                ) : (
                  <Repeat aria-hidden="true" size={18} strokeWidth={2.35} />
                )}
              </button>
            </div>

            <div className="spotify-progress-row">
              <span>{formatPlaybackTime(displayPositionMs)}</span>
              <input
                type="range"
                min="0"
                max={durationMs || 0}
                step="1000"
                value={displayPositionMs}
                onChange={(event) => {
                  setIsSeeking(true)
                  setSeekDraftMs(Number(event.target.value))
                }}
                onPointerUp={(event) => seekPlayback(event.currentTarget.value)}
                onBlur={(event) => {
                  if (isSeeking) {
                    seekPlayback(event.currentTarget.value)
                  }
                }}
                onKeyUp={(event) => {
                  if (
                    [
                      'ArrowLeft',
                      'ArrowRight',
                      'ArrowUp',
                      'ArrowDown',
                      'Home',
                      'End',
                    ].includes(event.key)
                  ) {
                    seekPlayback(event.currentTarget.value)
                  }
                }}
                disabled={!deviceId || !durationMs}
                aria-label="Seek playback"
                style={{ '--seek-progress': `${seekProgress}%` }}
              />
              <span>{formatPlaybackTime(durationMs)}</span>
            </div>
          </div>

          <div className="spotify-status-line">
            <span>
              <strong>{playerStatus}</strong>
              {playerStatusHint ? <small>{playerStatusHint}</small> : null}
            </span>
            <button type="button" onClick={disconnectSpotify}>
              Disconnect
            </button>
          </div>
        </div>
      )}

      {spotifyError ? (
        <div className="spotify-message" role="alert">
          <span>{spotifyError}</span>
          {spotifyErrorHint ? <small>{spotifyErrorHint}</small> : null}
        </div>
      ) : null}
    </section>
  )
}

export default SpotifyPanel
