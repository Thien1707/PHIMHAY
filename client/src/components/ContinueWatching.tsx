import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWatchHistory, type WatchHistoryItem } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function ContinueWatching() {
  const { user } = useAuth()
  const [history, setHistory] = useState<WatchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getWatchHistory()
        setHistory(data)
      } catch (err) {
        console.error('Failed to load watch history:', err)
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user])

  if (!user || loading || history.length === 0) {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Tiếp tục xem</h2>
      <div className="grid-posters">
        {history.slice(0, 6).map((item) => (
          <Link
            key={item._id}
            to={`/xem-phim/${item.movieId.slug}?episode=${item.episode}&time=${Math.floor(
              item.currentTime
            )}`}
            className="poster-card"
          >
            <div style={{ position: 'relative' }}>
              <img
                src={item.movieId.posterUrl || item.movieId.thumbUrl}
                alt={item.movieId.title}
              />
              {/* Progress bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'rgba(0,0,0,0.3)',
              }}>
                <div
                  style={{
                    height: '100%',
                    background: '#ef4444',
                    width: `${Math.min(
                      (item.currentTime / (item.currentTime + 300)) * 100,
                      95
                    )}%`
                  }}
                />
              </div>
            </div>
            <div className="poster-card__meta">
              <div style={{ flex: 1 }}>
                <div className="poster-title">{item.movieId.title}</div>
                <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '2px' }}>
                  Tập {item.episode} • {formatTime(item.currentTime)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
