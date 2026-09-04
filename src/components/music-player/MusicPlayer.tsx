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
import { islandPlaylist } from './music.data'

/** 播放模式的内部键，分别对应列表、单曲和随机。 */
type PlayMode = 'all' | 'one' | 'shuffle'
/** 点击模式按钮时按照这个数组顺序循环切换。 */
const playModes: PlayMode[] = ['all', 'one', 'shuffle']
/** 播放模式显示文案，与 playModes 中的内部键对应。 */
const modeLabels: Record<PlayMode, string> = {
  all: '列表循环',
  one: '单曲循环',
  shuffle: '随机播放',
}

/** 把音频秒数转为分:秒；元数据未加载时显示 0:00。 */
function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00'
  return `${Math.floor(value / 60)}:${Math.floor(value % 60)
    .toString()
    .padStart(2, '0')}`
}

/** 读取本机禁用歌曲记录，兼容旧的数字索引，损坏数据回退为空列表。 */
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

/** 恢复本机歌曲排序，把新加入但未保存的曲目补到尾部。 */
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

/** 播放器总成：管理音频状态、切歌、歌单排序和本机偏好，界面事件驱动 audio 元素。 */
export function MusicPlayer() {
  // 歌曲清空时不挂载控制器，避免读取不存在的 track.src 或注册无用监听。
  return islandPlaylist.length ? <MusicPlayerControls /> : null
}

/** 有歌曲时才维护播放器状态和音频事件；外层只负责是否显示。 */
function MusicPlayerControls() {
  /** 保存音频与弹窗 DOM 引用，后续直接调用播放、暂停和外部点击检测。 */
  const audioRef = useRef<HTMLAudioElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  /** 管理面板是否展开；只影响当前组件的界面状态。 */
  const [open, setOpen] = useState(false)
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  /** 从本机保存的排序初始化歌单，后续上移下移会更新此数组。 */
  const [playlist, setPlaylist] = useState(readTrackOrder)
  const [trackIndex, setTrackIndex] = useState(0)
  const [disabledTracks, setDisabledTracks] = useState<string[]>(readDisabledTracks)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  /** 读取保存的音量与播放模式，缺少记录时使用默认值。 */
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('island-volume') ?? 0.55))
  const [playMode, setPlayMode] = useState<PlayMode>(() => {
    const saved = localStorage.getItem('island-play-mode')
    return saved === 'one' || saved === 'shuffle' ? saved : 'all'
  })
  const track = playlist[trackIndex]
  const isDisabled = (index: number) => disabledTracks.includes(playlist[index].src)

  // 点击播放器外部时关闭弹窗；卸载时解除全局监听。
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // 将音量写入 audio 并保存到本机，下次打开恢复。
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    localStorage.setItem('island-volume', String(volume))
  }, [volume])

  // 切歌或切换播放状态后尝试播放，浏览器拒绝播放时恢复暂停状态。
  useEffect(() => {
    if (playing && audioRef.current) audioRef.current.play().catch(() => setPlaying(false))
  }, [trackIndex, playing])

  // 保存播放模式，刷新页面后继续使用。
  useEffect(() => localStorage.setItem('island-play-mode', playMode), [playMode])
  // 保存禁用歌曲清单，以歌曲地址识别条目。
  useEffect(
    () => localStorage.setItem('island-disabled-tracks', JSON.stringify(disabledTracks)),
    [disabledTracks],
  )
  // 保存歌单顺序，供下次初始化恢复。
  useEffect(
    () =>
      localStorage.setItem('island-track-order', JSON.stringify(playlist.map((item) => item.src))),
    [playlist],
  )

  /** 切换到指定可用曲目，重置进度并保留调用者要求的播放状态。 */
  const selectTrack = (index: number, shouldPlay = playing) => {
    /** 将歌曲索引折回歌单范围，允许前后切歌首尾循环。 */
    const normalized = (index + playlist.length) % playlist.length
    if (isDisabled(normalized)) return
    setTrackIndex(normalized)
    setCurrentTime(0)
    setPlaying(shouldPlay)
  }

  /** 向前或向后寻找未禁用的歌曲；全部禁用时返回 -1。 */
  const findSequentialTrack = (direction: 1 | -1, disabled = disabledTracks) => {
    for (let step = 1; step <= playlist.length; step += 1) {
      const candidate = (trackIndex + direction * step + playlist.length) % playlist.length
      if (!disabled.includes(playlist[candidate].src)) return candidate
    }
    return -1
  }

  /** 从可用歌曲随机抽取，存在其他歌曲时避免立即重复当前曲目。 */
  const randomTrackIndex = () => {
    const enabled = playlist.map((_, index) => index).filter((index) => !isDisabled(index))
    const alternatives = enabled.filter((index) => index !== trackIndex)
    /** 优先从其他可用歌曲抽取；只剩当前歌曲时允许再次选择它。 */
    const pool = alternatives.length ? alternatives : enabled
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : -1
  }

  /** 按随机或顺序模式选择下一首，无可用歌曲时停止播放。 */
  const goNext = (shouldPlay = playing) => {
    const next = playMode === 'shuffle' ? randomTrackIndex() : findSequentialTrack(1)
    if (next >= 0) selectTrack(next, shouldPlay)
    else setPlaying(false)
  }

  /** 查找上一首可用歌曲，跳过禁用项。 */
  const goPrevious = () => {
    const previous = findSequentialTrack(-1)
    if (previous >= 0) selectTrack(previous)
  }

  /** 播放结束后按单曲循环或下一首规则继续。 */
  const handleEnded = () => {
    if (playMode === 'one' && !isDisabled(trackIndex) && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => setPlaying(false))
    } else goNext(true)
  }

  /** 响应播放暂停按钮；禁用曲目自动跳到可用项，并处理浏览器拒绝播放。 */
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

  /** 在列表、单曲、随机三种模式中循环。 */
  const cyclePlayMode = () => {
    setPlayMode(playModes[(playModes.indexOf(playMode) + 1) % playModes.length])
  }

  /** 启用或禁用曲目；禁用正在播放的歌曲时寻找替代项或暂停。 */
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

  /** 交换相邻歌单条目，并按歌曲地址保持当前播放曲目不变。 */
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
          {/* 当前曲目的封面、标题和歌手；封面缺失时回退音乐图标。 */}
          <div className="music-now">
            <span className={`music-cover${playing ? ' spinning' : ''}`}>
              {track.cover ? (
                <img src={track.cover} alt={`${track.title} 封面`} />
              ) : (
                <Icon src={musicIcon} size={58} />
              )}
            </span>
            <span>
              <b>{track.title}</b>
              <small>{track.artist}</small>
            </span>
          </div>
          {/* 进度滑块同步 audio.currentTime，元数据未加载时最大值为 0。 */}
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
          {/* 播放模式、上一首、播放暂停、下一首及歌单开关。 */}
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
          {/* 音量滑块，将 0 到 1 的数值传给音频元素。 */}
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
