import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

type Ep = { name: string; slug: string; link_embed: string; link_m3u8: string }
type EpisodeServer = { server_name: string; server_data: Ep[] }

type MovieDetail = {
  id: string
  slug: string
  title: string
  canWatch: boolean
  accessReason: string
  episodes: EpisodeServer[]
  commentRatingPolicy: 'public' | 'members'
}

type DetailRes = { movie: MovieDetail }

type CommentItem = {
  id: string
  body: string
  createdAt: string
  user: { id: string; displayName: string; email: string } | null
}

type RatingRes = {
  average: number
  count: number
  myRating: number | null
}

export function WatchPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [detail, setDetail] = useState<DetailRes | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentItem[] | null>(null)
  const [commentsErr, setCommentsErr] = useState<string | null>(null)
  const [ratings, setRatings] = useState<RatingRes | null>(null)
  const [ratingsErr, setRatingsErr] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [stars, setStars] = useState(5)
  const [hoverStars, setHoverStars] = useState(0)
  const [busy, setBusy] = useState(false)
  const [srvIdx, setSrvIdx] = useState(0)
  const [epIdx, setEpIdx] = useState(0)
  const playerRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (!slug) return
    setErr(null)
    api<DetailRes>(`/api/movies/${encodeURIComponent(slug)}`)
      .then(setDetail)
      .catch((e: Error) => setErr(e.message))
  }, [slug])

  const m = detail?.movie

  useEffect(() => {
    if (!m?.id) return
    setCommentsErr(null)
    setRatingsErr(null)
    api<{ items: CommentItem[] }>(`/api/comments/movie/${m.id}`)
      .then((d) => setComments(d.items))
      .catch((e: Error) => {
        setComments(null)
        setCommentsErr(e.message)
      })
    api<RatingRes>(`/api/ratings/movie/${m.id}`)
      .then(setRatings)
      .catch((e: Error) => {
        setRatings(null)
        setRatingsErr(e.message)
      })
  }, [m?.id, user?.id])

  const server = m?.episodes?.[srvIdx]
  const episode = server?.server_data?.[epIdx]
  const embedUrl = episode?.link_embed || ''

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    } else {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [epIdx, srvIdx])

  const lockMessage = useMemo(() => {
    if (!m) return null
    if (m.canWatch) return null
    if (m.accessReason === 'guest') return 'Khách chỉ xem trang chủ — đăng nhập để xem phim.'
    if (m.accessReason === 'vip_only') return 'Phim chỉ dành cho VIP. Nâng cấp để xem.'
    return 'Bạn không thể xem nội dung này.'
  }, [m])

  async function submitComment(e: FormEvent) {
    e.preventDefault()
    if (!user || !m?.id) return
    setBusy(true)
    try {
      await api(`/api/comments/movie/${m.id}`, { method: 'POST', json: { body: newComment } })
      setNewComment('')
      const d = await api<{ items: CommentItem[] }>(`/api/comments/movie/${m.id}`)
      setComments(d.items)
    } catch (e) {
      setCommentsErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  async function submitRating(e: FormEvent) {
    e.preventDefault()
    if (!user || !m?.id) return
    setBusy(true)
    try {
      await api(`/api/ratings/movie/${m.id}`, { method: 'POST', json: { stars } })
      const r = await api<RatingRes>(`/api/ratings/movie/${m.id}`)
      setRatings(r)
    } catch (e) {
      setRatingsErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteComment(id: string) {
    if (!window.confirm('Xóa bình luận này?')) return
    setBusy(true)
    try {
      await api(`/api/comments/${id}`, { method: 'DELETE' })
      setComments((prev) => (prev || []).filter((c) => c.id !== id))
    } catch (e) {
      setCommentsErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  const canComment = useMemo(() => {
    if (!user) {
      return false // Guests can't comment
    }
    return true
  }, [user])

  const canViewComments = useMemo(() => {
    // Show comments if public or if user is logged in
    return m?.commentRatingPolicy === 'public' || !!user
  }, [user, m?.commentRatingPolicy])

  return (
    <div className="page watch-page">
      <h1 className="watch-title">
        <Link to={`/phim/${slug}`}>{m?.title || 'Xem phim'}</Link>
      </h1>
      {err && <p className="error-text">{err}</p>}
      {!detail && !err && <p className="muted">Đang tải…</p>}

      {lockMessage && (
        <div className="lock-box">
          <p>{lockMessage}</p>
          {!user && (
            <Link to="/login" className="btn btn-primary">
              Đăng nhập
            </Link>
          )}
          {user && m?.accessReason === 'vip_only' && (
            <Link to="/vip" className="btn btn-primary">
              Nâng VIP
            </Link>
          )}
        </div>
      )}

      {m?.canWatch && m.episodes?.length > 0 && (
        <section ref={playerRef} className="player-block">
          {embedUrl ? (
            <div className="iframe-wrap">
              <iframe title="player" src={embedUrl} allowFullScreen />
            </div>
          ) : (
            <p className="muted">Không có link phát.</p>
          )}

          <div className="button-group-label">Server</div>
          <div className="button-group">
            {m.episodes.map((s, i) => (
              <button
                key={s.server_name}
                type="button"
                className={`btn ${i === srvIdx ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setSrvIdx(i)
                  setEpIdx(0)
                }}
              >
                {s.server_name}
              </button>
            ))}
          </div>

          <div className="button-group-label">Tập</div>
          <div className="button-group episode-list">
            {(server?.server_data || []).map((ep, i) => (
              <button
                key={ep.slug}
                type="button"
                className={`btn ${i === epIdx ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setEpIdx(i)}
              >
                {ep.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {m?.canWatch && canViewComments && (
        <section className="reviews">
          <h2>Đánh giá & Bình luận</h2>
          {ratingsErr && <p className="error-text">{ratingsErr}</p>}
          {ratings && (
            <>
              <p>
                Trung bình: <strong>{ratings.average.toFixed(1)}</strong> / 5 ({ratings.count} lượt)
                {ratings.myRating != null && <span className="muted"> — Bạn đã chọn {ratings.myRating}★</span>}
              </p>
              {user && (
                <form className="rating-form" onSubmit={submitRating}>
                  <div className="star-rating">
                    <label>Sao của bạn (1–5)</label>
                    <div onMouseLeave={() => setHoverStars(0)}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={n <= (hoverStars || stars) ? 'star active' : 'star'}
                          onClick={() => setStars(n)}
                          onMouseEnter={() => setHoverStars(n)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Gửi đánh giá
                  </button>
                </form>
              )}
            </>
          )}

          <h3 style={{ marginTop: '1.5rem' }}>Bình luận</h3>
          {commentsErr && <p className="error-text">{commentsErr}</p>}
          {canComment && (
            <form onSubmit={submitComment} className="comment-form">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận…"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Gửi
              </button>
            </form>
          )}
          <ul className="comment-list">
            {(comments || []).map((c) => (
              <li key={c.id}>
                <strong>{c.user?.displayName || c.user?.email || 'User'}</strong>
                <span className="muted"> — {new Date(c.createdAt).toLocaleString()}</span>
                {user && (c.user?.id === user.id || user.isAdmin) && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="btn btn-danger btn-sm"
                    disabled={busy}
                    style={{ marginLeft: '1rem' }}
                  >
                    Xóa
                  </button>
                )}
                <p>{c.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <style>{`
        .watch-title a {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          display: inline-block;
        }
        .lock-box {
          background: rgba(229, 9, 20, 0.12);
          border: 1px solid rgba(229, 9, 20, 0.35);
          padding: 1rem 1.25rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
        }
        .player-block {
          margin-bottom: 2rem;
        }
        .button-group-label {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 1rem;
        }
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .episode-list {
          max-height: 250px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.75rem;
          border-radius: 8px;
        }
        .iframe-wrap {
          margin-top: 1rem;
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid #333;
          background: #000;
        }
        .iframe-wrap iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .reviews {
          margin-top: 2rem;
        }
        .comment-form {
          margin-bottom: 1rem;
        }
        .comment-form textarea {
          margin-bottom: 0.5rem;
        }
        .comment-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .comment-list li {
          border-bottom: 1px solid #222;
          padding: 0.75rem 0;
        }
        .rating-form {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: flex-end;
          margin-top: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .star-rating {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .star-rating .star {
          color: #555;
          cursor: pointer;
          font-size: 1.5rem;
          transition: color 0.2s;
        }
        .star-rating .star.active,
        .star-rating .star:hover {
          color: #f5c518;
        }
        .btn-danger {
          background-color: #ef4444;
          color: white;
        }
      `}</style>
    </div>
  )
}
