import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

type Ep = { name: string; slug: string; link_embed: string; link_m3u8: string }
type EpisodeServer = { server_name: string; server_data: Ep[] }

type MovieDetail = {
  id: string
  slug: string
  title: string
  originName: string
  content: string
  posterUrl: string
  year: number | null
  viewStatus: number
  commentRatingPolicy: 'public' | 'members'
  canWatch: boolean
  accessReason: string
  trailer_url?: string
  episodes: EpisodeServer[]
}

type DetailRes = { movie: MovieDetail }

type CommentItem = {
  id: string
  body: string
  createdAt: string
  user: { displayName: string; email: string } | null
}

type RatingRes = {
  average: number
  count: number
  myRating: number | null
  items: { id: string; stars: number; user: { displayName: string } | null }[]
}

export function MovieDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [detail, setDetail] = useState<DetailRes | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [srvIdx, setSrvIdx] = useState(0)
  const [epIdx, setEpIdx] = useState(0)
  const [comments, setComments] = useState<CommentItem[] | null>(null)
  const [commentsErr, setCommentsErr] = useState<string | null>(null)
  const [ratings, setRatings] = useState<RatingRes | null>(null)
  const [ratingsErr, setRatingsErr] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [stars, setStars] = useState(5)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!slug) return
    setErr(null)
    api<DetailRes>(`/api/movies/${encodeURIComponent(slug)}`)
      .then(setDetail)
      .catch((e: Error) => setErr(e.message))
  }, [slug])

  const m = detail?.movie
  const server = m?.episodes?.[srvIdx]
  const episode = server?.server_data?.[epIdx]
  const embedUrl = episode?.link_embed || ''

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

  const lockMessage = useMemo(() => {
    if (!m) return null
    if (m.canWatch) return null
    if (m.accessReason === 'guest') return 'Khách chỉ xem trang chủ — đăng nhập để xem phim.'
    if (m.accessReason === 'vip_only') return 'Phim chỉ dành cho VIP. Nâng cấp để xem.'
    return 'Bạn không thể xem nội dung này.'
  }, [m])

  async function submitComment(e: React.FormEvent) {
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

  async function submitRating(e: React.FormEvent) {
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

  return (
    <div className="page movie-page">
      {err && <p className="error-text">{err}</p>}
      {!detail && !err && <p className="muted">Đang tải…</p>}
      {m && (
        <>
          <div className="movie-head">
            <img className="movie-poster" src={m.posterUrl} alt="" />
            <div>
              <h1>{m.title}</h1>
              {m.originName && <p className="muted">{m.originName}</p>}
              <p className="muted">{m.year}</p>
              {m.viewStatus === 1 && <span className="pill-vip-inline">VIP only</span>}
              <p className="movie-desc">{m.content}</p>
              {m.trailer_url && (
                <a href={m.trailer_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn--sm">
                  Trailer
                </a>
              )}
            </div>
          </div>

          {lockMessage && (
            <div className="lock-box">
              <p>{lockMessage}</p>
              {!user && (
                <Link to="/login" className="btn btn-primary">
                  Đăng nhập
                </Link>
              )}
              {user && m.accessReason === 'vip_only' && (
                <Link to="/vip" className="btn btn-primary">
                  Nâng VIP
                </Link>
              )}
            </div>
          )}

          {m.canWatch && m.episodes?.length > 0 && (
            <section className="player-block">
              <h2>Xem phim</h2>
              <div className="select-row">
                <label>
                  Server
                  <select value={srvIdx} onChange={(e) => { setSrvIdx(Number(e.target.value)); setEpIdx(0) }}>
                    {m.episodes.map((s, i) => (
                      <option key={s.server_name} value={i}>
                        {s.server_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tập
                  <select value={epIdx} onChange={(e) => setEpIdx(Number(e.target.value))}>
                    {(server?.server_data || []).map((ep, i) => (
                      <option key={ep.slug} value={i}>
                        {ep.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {embedUrl ? (
                <div className="iframe-wrap">
                  <iframe title="player" src={embedUrl} allowFullScreen />
                </div>
              ) : (
                <p className="muted">Không có link phát.</p>
              )}
            </section>
          )}

          <section className="reviews">
            <h2>Đánh giá</h2>
            {ratingsErr && <p className="error-text">{ratingsErr}</p>}
            {ratings && (
              <>
                <p>
                  Trung bình: <strong>{ratings.average}</strong> / 5 ({ratings.count} lượt)
                  {ratings.myRating != null && (
                    <span className="muted"> — Bạn đã chọn {ratings.myRating}★</span>
                  )}
                </p>
                {user && (
                  <form className="rating-form" onSubmit={submitRating}>
                    <label>
                      Sao của bạn (1–5)
                      <select value={stars} onChange={(e) => setStars(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                      Gửi đánh giá
                    </button>
                  </form>
                )}
              </>
            )}

            <h3 style={{ marginTop: '1.5rem' }}>Bình luận</h3>
            {commentsErr && <p className="error-text">{commentsErr}</p>}
            {user && (
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
                  <p>{c.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <style>{`
        .movie-head {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        @media (min-width: 640px) {
          .movie-head {
            grid-template-columns: 220px 1fr;
          }
        }
        .movie-poster {
          width: 100%;
          border-radius: 8px;
          object-fit: cover;
        }
        .movie-desc {
          white-space: pre-wrap;
          line-height: 1.45;
        }
        .pill-vip-inline {
          display: inline-block;
          background: #f5c518;
          color: #111;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
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
        .select-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .select-row select {
          display: block;
          margin-top: 0.35rem;
          min-width: 200px;
        }
        .iframe-wrap {
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
        }
      `}</style>
    </div>
  )
}
