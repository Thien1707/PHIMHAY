import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

type MovieItem = {
  id: string
  slug: string
  title: string
  posterUrl: string
  thumbUrl: string
  year: number | null
  viewStatus: number
}

type ListRes = {
  items: MovieItem[]
  pagination: { page: number; totalPages: number; total: number }
}

export function Home() {
  const { user } = useAuth()
  const [data, setData] = useState<ListRes | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api<ListRes>('/api/movies?page=1&limit=24')
      .then(setData)
      .catch((e: Error) => setErr(e.message))
  }, [])

  const hero = data?.items[0]

  return (
    <div className="home">
      {hero && (
        <section className="hero-banner">
          <div
            className="hero-banner__bg"
            style={{
              backgroundImage: `linear-gradient(90deg, #0b0b0b 28%, transparent 72%), url(${hero.posterUrl || hero.thumbUrl})`,
            }}
          />
          <div className="hero-banner__content">
            <p className="hero-tag">Nổi bật</p>
            <h1>{hero.title}</h1>
            <p className="muted">{hero.year}</p>
            <div className="hero-actions">
              <Link to={`/phim/${hero.slug}`} className="btn btn-primary">
                Chi tiết
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="page home-rows">
        {!user && (
          <p className="guest-hint muted">
            Bạn đang xem dạng khách — duyệt danh sách được. Đăng nhập để xem phim; VIP để xem toàn bộ nội dung VIP.
          </p>
        )}
        {err && <p className="error-text">{err}</p>}
        {!data && !err && <p className="muted">Đang tải…</p>}
        {data && data.items.length === 0 && <p className="muted">Chưa có phim trong catalog. Admin hãy import từ phimapi.</p>}
        {data && data.items.length > 0 && (
          <>
            <h2 className="row-title">Danh sách phim</h2>
            <div className="grid-posters">
              {data.items.map((m) => (
                <Link key={m.id} to={`/phim/${m.slug}`} className="poster-card">
                  <img src={m.thumbUrl || m.posterUrl} alt="" loading="lazy" />
                  <div className="poster-card__meta">
                    <span className="poster-title">{m.title}</span>
                    {m.viewStatus === 1 && <span className="pill pill-vip">VIP</span>}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
      <style>{`
        .home {
          min-height: 100vh;
        }
        .hero-banner {
          position: relative;
          min-height: 56vh;
          display: flex;
          align-items: flex-end;
          padding: 6rem 1.5rem 3rem;
        }
        .hero-banner__bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center top;
          z-index: 0;
        }
        .hero-banner__content {
          position: relative;
          z-index: 1;
          max-width: 520px;
        }
        .hero-tag {
          color: var(--nf-red);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
        }
        .hero-banner h1 {
          font-size: clamp(1.75rem, 4vw, 2.75rem);
          margin: 0.35rem 0;
          line-height: 1.1;
        }
        .hero-actions {
          margin-top: 1rem;
        }
        .home-rows {
          padding-top: 1rem;
        }
        .guest-hint {
          margin-bottom: 1.25rem;
          max-width: 640px;
        }
        .row-title {
          margin: 0 0 1rem;
          font-size: 1.15rem;
        }
        .poster-card {
          display: block;
          border-radius: 6px;
          overflow: hidden;
          background: #222;
          transition: transform 0.15s ease;
        }
        .poster-card:hover {
          transform: scale(1.04);
          z-index: 2;
        }
        .poster-card img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          display: block;
        }
        .poster-card__meta {
          padding: 0.45rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.35rem;
        }
        .poster-title {
          font-size: 0.78rem;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .pill-vip {
          background: #f5c518;
          color: #111;
        }
      `}</style>
    </div>
  )
}
