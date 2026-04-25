import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getWatchHistory,
  deleteWatchHistoryItem,
  clearAllWatchHistory,
  type WatchHistoryItem,
} from '../api/client'

export function WatchHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState<WatchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadHistory()
  }, [user, navigate])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWatchHistory()
      setHistory(data)
    } catch (err) {
      console.error('Failed to load watch history:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử xem')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (historyId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa mục này khỏi lịch sử?')) return

    try {
      await deleteWatchHistoryItem(historyId)
      setHistory(history.filter((item) => item._id !== historyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa mục')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Bạn chắc chắn muốn xóa toàn bộ lịch sử xem? Hành động này không thể hoàn tác.'))
      return

    try {
      await clearAllWatchHistory()
      setHistory([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa lịch sử')
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Đang tải lịch sử xem...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Lịch sử xem phim</h1>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Không có lịch sử xem phim</p>
          <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Quay lại trang chủ
          </Link>
        </div>
      ) : (
        <div>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Tổng cộng: {history.length} phim</p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {history.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#1f2937',
                  borderRadius: '0.5rem',
                  border: '1px solid #374151',
                }}
              >
                {/* Poster */}
                <Link
                  to={`/xem-phim/${item.movieId.slug}?episode=${item.episode}&time=${Math.floor(item.currentTime)}`}
                  style={{
                    flexShrink: 0,
                    width: '120px',
                    height: '180px',
                    overflow: 'hidden',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                  }}
                >
                  <img
                    src={item.movieId.posterUrl || item.movieId.thumbUrl}
                    alt={item.movieId.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Link>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Link
                      to={`/xem-phim/${item.movieId.slug}?episode=${item.episode}&time=${Math.floor(item.currentTime)}`}
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {item.movieId.title}
                    </Link>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Tập {item.episode} • Xem từ {formatTime(item.currentTime)}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Cập nhật: {formatDate(item.updatedAt)}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#374151',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: '#ef4444',
                          width: `${Math.min((item.currentTime / (item.currentTime + 300)) * 100, 95)}%`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                  <Link
                    to={`/xem-phim/${item.movieId.slug}?episode=${item.episode}&time=${Math.floor(item.currentTime)}`}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                    }}
                  >
                    Tiếp tục xem
                  </Link>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
