import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  country: string | null
}

type ListRes = {
  items: MovieItem[]
  pagination: { page: number; totalPages: number; total: number }
}


export function Home() {
  const { user } = useAuth()
  const [data, setData] = useState<ListRes | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q')
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const country = searchParams.get('country')

  useEffect(() => {
    setData(null)
    setErr(null)
    const page = searchParams.get('page') || '1'
    let url = `/api/movies?page=${page}&limit=24`
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('limit', '24')

    if (q) {
      url = `/api/movies/search?q=${encodeURIComponent(q)}&page=${page}&limit=24`
    } else {
      if (category) params.set('category', category)
      if (type) params.set('type', type)
      if (country) params.set('country', country)
      url = `/api/movies?${params.toString()}`
    }

    api<ListRes>(url)
      .then(setData)
      .catch((e: Error) => setErr(e.message))
  }, [q, searchParams, category, type, country])

  const heroMovies = !q && data?.items.slice(0, 5)
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)

  useEffect(() => {
    if (!heroMovies || heroMovies.length < 2) return
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroMovies])

  const hero = heroMovies && heroMovies[currentHeroIndex]

  return (
    <div className="home">
      {hero && (
        <section key={hero.id} className="hero-banner hero-banner-fade">
          <div
            className="hero-banner__bg"
            style={{
              backgroundImage: `linear-gradient(90deg, #0b0b0b 28%, rgba(11, 11, 11, 0.4) 100%), url(${hero.thumbUrl || hero.posterUrl})`,
            }}
          />
          <div className="hero-banner__content">
            <div className="hero-banner__info">
              <p className="hero-tag">Nổi bật</p>
              <h1>{hero.title}</h1>
              <p className="muted">{hero.year}</p>
              <div className="hero-actions">
                <Link to={`/xem-phim/${hero.slug}`} className="btn btn-primary">
                  Xem phim
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="page home-rows">
        {!user && !q && (
          <p className="guest-hint muted">
            Bạn đang xem dạng khách — duyệt danh sách được. Đang nhập để xem phim; VIP để xem toàn bộ nội dung VIP.
          </p>
        )}
        {err && <p className="error-text">{err}</p>}
        {!data && !err && <p className="muted">Đang tải…</p>}

        {q && (
          <h2 className="row-title" style={{ marginTop: '1rem' }}>
            Kết quả tìm kiếm cho "{q}"
          </h2>
        )}

        {data && data.items.length === 0 && (
          <p className="muted" style={{ marginTop: '1rem' }}>
            {q ? 'Không tìm thấy kết quả nào.' : 'Chưa có phim trong catalog. Admin hãy import từ phimapi.'}
          </p>
        )}
        {data && data.items.length > 0 && (
          <>
            {!q && <h2 className="row-title">Danh sách phim</h2>}
            <div className="grid-posters">
              {data.items.map((m) => (
                <Link key={m.id} to={`/phim/${m.slug}`} className="poster-card">
                  <img src={m.posterUrl || m.thumbUrl} alt="" loading="lazy" />
                  <div className="poster-card__meta">
                    <span className="poster-title">{m.title}</span>
                    {m.viewStatus === 1 && <span className="pill pill-vip">VIP</span>}
                  </div>
                </Link>
              ))}
            </div>
            <div className="pagination">
              {data.pagination.page > 1 && (
                <Link to={`/?page=${data.pagination.page - 1}`} className="btn btn-primary">
                  Trang trước
                </Link>
              )}
              <span className="page-info">
                Trang {data.pagination.page} / {data.pagination.totalPages}
              </span>
              {data.pagination.page < data.pagination.totalPages && (
                <Link to={`/?page=${data.pagination.page + 1}`} className="btn btn-primary">
                  Trang sau
                </Link>
              )}
            </div>
          </>
        )}
      </section>
      <style>{`
        @keyframes herofade {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
        .hero-banner-fade {
          animation: herofade 0.5s;
        }
        .home {
          min-height: 100vh;
        }
        .hero-banner {
          position: relative;
          min-height: 100vh; /* Tăng chiều cao tối thiểu để banner lớn hơn */
          display: flex;
          align-items: flex-end;
          padding: 8rem 4% 4rem; /* Tăng padding-top để đẩy banner xuống dưới navbar */
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
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }
        .hero-banner__info {
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
        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
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
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 1rem;
          gap: 1rem;
        }
      `}</style>
    </div>
  )
}
