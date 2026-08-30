import { Icon } from 'animal-island-ui'
import musicIcon from 'animal-island-ui/items/item-484.png'
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { islandPlaylist } from '../data/music'

type PlayMode = 'all' | 'one' | 'shuffle'
const playModes: PlayMode[] = ['all', 'one', 'shuffle']
const modeLabels: Record<PlayMode, string> = {
  all: '列表循环',
  one: '单曲循环',
  shuffle: '随机播放',
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00'
  return `${Math.floor(value / 60)}:${Math.floor(value % 60)
    .toString()
    .padStart(2, '0')}`
}

function readDisabledTracks() {
  try {
    const saved = JSON.parse(localStorage.getItem('island-disabled-tracks') ?? '[]')
    if (!Array.isArray(saved)) return []
    return saved
      .map((item) => (typeof item === 'number' ? islandPlaylist[item]?.src : item))
      .filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function readTrackOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem('island-track-order') ?? '[]')
    if (!Array.isArray(saved)) return islandPlaylist
    const ordered = saved
      .map((src) => islandPlaylist.find((track) => track.src === src))
      .filter((track): track is (typeof islandPlaylist)[number] => Boolean(track))
    const missing = islandPlaylist.filter(
      (track) => !ordered.some((item) => item.src === track.src),
    )
    return [...ordered, ...missing]
  } catch {
    return islandPlaylist
  }
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [playlist, setPlaylist] = useState(readTrackOrder)
  const [trackIndex, setTrackIndex] = useState(0)
  const [disabledTracks, setDisabledTracks] = useState<string[]>(readDisabledTracks)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('island-volume') ?? 0.55))
  const [playMode, setPlayMode] = useState<PlayMode>(() => {
    const saved = localStorage.getItem('island-play-mode')
    return saved === 'one' || saved === 'shuffle' ? saved : 'all'
  })
  const track = playlist[trackIndex]
  const isDisabled = (index: number) => disabledTracks.includes(playlist[index].src)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    localStorage.setItem('island-volume', String(volume))
  }, [volume])

  useEffect(() => {
    if (playing && audioRef.current) audioRef.current.play().catch(() => setPlaying(false))
  }, [trackIndex, playing])

  useEffect(() => localStorage.setItem('island-play-mode', playMode), [playMode])
  useEffect(
    () => localStorage.setItem('island-disabled-tracks', JSON.stringify(disabledTracks)),
    [disabledTracks],
  )
  useEffect(
    () =>
      localStorage.setItem('island-track-order', JSON.stringify(playlist.map((item) => item.src))),
    [playlist],
  )
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('island-music-state', { detail: { playing } }))
  }, [playing])

  const selectTrack = (index: number, shouldPlay = playing) => {
    const normalized = (index + playlist.length) % playlist.length
    if (isDisabled(normalized)) return
    setTrackIndex(normalized)
    setCurrentTime(0)
    setPlaying(shouldPlay)
  }

  const findSequentialTrack = (direction: 1 | -1, disabled = disabledTracks) => {
    for (let step = 1; step <= playlist.length; step += 1) {
      const candidate = (trackIndex + direction * step + playlist.length) % playlist.length
      if (!disabled.includes(playlist[candidate].src)) return candidate
    }
    return -1
  }

  const randomTrackIndex = () => {
    const enabled = playlist.map((_, index) => index).filter((index) => !isDisabled(index))
    const alternatives = enabled.filter((index) => index !== trackIndex)
    const pool = alternatives.length ? alternatives : enabled
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : -1
  }

  const goNext = (shouldPlay = playing) => {
    const next = playMode === 'shuffle' ? randomTrackIndex() : findSequentialTrack(1)
    if (next >= 0) selectTrack(next, shouldPlay)
    else setPlaying(false)
  }

  const goPrevious = () => {
    const previous = findSequentialTrack(-1)
    if (previous >= 0) selectTrack(previous)
  }

  const handleEnded = () => {
    if (playMode === 'one' && !isDisabled(trackIndex) && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => setPlaying(false))
    } else goNext(true)
  }

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      return
    }
    if (isDisabled(trackIndex)) {
      const firstEnabled = playlist.findIndex((_, index) => !isDisabled(index))
      if (firstEnabled >= 0) selectTrack(firstEnabled, true)
      return
    }
    await audio.play().catch(() => setPlaying(false))
  }

  const cyclePlayMode = () => {
    setPlayMode(playModes[(playModes.indexOf(playMode) + 1) % playModes.length])
  }

  const toggleTrack = (index: number) => {
    const willDisable = !isDisabled(index)
    const trackSrc = playlist[index].src
    const nextDisabled = willDisable
      ? [...disabledTracks, trackSrc]
      : disabledTracks.filter((item) => item !== trackSrc)
    setDisabledTracks(nextDisabled)
    if (willDisable && index === trackIndex) {
      const next = findSequentialTrack(1, nextDisabled)
      if (next >= 0) {
        setTrackIndex(next)
        setCurrentTime(0)
      } else {
        audioRef.current?.pause()
        setPlaying(false)
      }
    }
  }

  const moveTrack = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= playlist.length) return
    const currentSrc = track.src
    const nextPlaylist = [...playlist]
    ;[nextPlaylist[index], nextPlaylist[target]] = [nextPlaylist[target], nextPlaylist[index]]
    setPlaylist(nextPlaylist)
    setTrackIndex(nextPlaylist.findIndex((item) => item.src === currentSrc))
  }

  const ModeIcon = playMode === 'all' ? Repeat : playMode === 'one' ? Repeat1 : Shuffle

  return (
    <div className="music-player" ref={panelRef}>
      <button
        type="button"
        className={`music-trigger${playing ? ' is-playing' : ''}`}
        aria-label={playing ? '打开音乐播放器，音乐正在播放' : '打开音乐播放器'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon src={musicIcon} size={32} />
        {playing && <i aria-hidden="true" />}
      </button>
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={handleEnded}
      />
      {open && (
        <section className="music-popover" aria-label="风铃岛音乐播放器">
          <header>
            <span>
              <small>NOW PLAYING</small>
              <b>风铃岛电台</b>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭播放器">
              <X size={17} />
            </button>
          </header>
          <div className="music-now">
            <span className={`music-cover${playing ? ' spinning' : ''}`}>
              <Icon src={musicIcon} size={58} />
            </span>
            <span>
              <b>{track.title}</b>
              <small>{track.artist}</small>
            </span>
          </div>
          <input
            className="music-progress"
            type="range"
            min="0"
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            aria-label="播放进度"
            onChange={(event) => {
              const next = Number(event.target.value)
              if (audioRef.current) audioRef.current.currentTime = next
              setCurrentTime(next)
            }}
          />
          <div className="music-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="music-control-row">
            <button
              className="music-mode-toggle"
              type="button"
              onClick={cyclePlayMode}
              aria-label={`${modeLabels[playMode]}，点击切换模式`}
              title={modeLabels[playMode]}
            >
              <ModeIcon size={18} />
              <small>{modeLabels[playMode]}</small>
            </button>
            <div className="music-controls">
              <button type="button" onClick={goPrevious} aria-label="上一首">
                <SkipBack size={19} />
              </button>
              <button
                type="button"
                className="music-play"
                onClick={togglePlayback}
                aria-label={playing ? '暂停' : '播放'}
              >
                {playing ? (
                  <Pause size={21} fill="currentColor" />
                ) : (
                  <Play size={21} fill="currentColor" />
                )}
              </button>
              <button type="button" onClick={() => goNext()} aria-label="下一首">
                <SkipForward size={19} />
              </button>
            </div>
            <button
              className={`music-list-toggle${playlistOpen ? ' active' : ''}`}
              type="button"
              onClick={() => setPlaylistOpen((value) => !value)}
              aria-label="展开或收起播放列表"
              title="播放列表"
            >
              <ListMusic size={19} />
            </button>
          </div>
          <label className="music-volume">
            <Volume2 size={15} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="音量"
            />
          </label>
          {playlistOpen && (
            <div className="music-playlist">
              {playlist.map((item, index) => {
                const disabled = isDisabled(index)
                return (
                  <div
                    className={`music-track${index === trackIndex ? ' active' : ''}${disabled ? ' disabled' : ''}`}
                    key={item.title}
                  >
                    <button
                      type="button"
                      className="music-track-select"
                      disabled={disabled}
                      onClick={() => selectTrack(index, true)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <b>{item.title}</b>
                      {index === trackIndex && playing ? <i>♪</i> : null}
                    </button>
                    <button
                      type="button"
                      className="music-track-toggle"
                      onClick={() => toggleTrack(index)}
                      aria-label={`${disabled ? '启用' : '禁用'} ${item.title}`}
                    >
                      {disabled ? '启用' : '禁用'}
                    </button>
                    <span className="music-track-order">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveTrack(index, -1)}
                        aria-label={`上移 ${item.title}`}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={index === playlist.length - 1}
                        onClick={() => moveTrack(index, 1)}
                        aria-label={`下移 ${item.title}`}
                      >
                        <ChevronDown size={13} />
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
