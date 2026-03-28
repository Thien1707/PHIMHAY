import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { FilterDropdowns } from './FilterDropdowns'

import { UserMenu } from './UserMenu'

function SearchForm() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')

  useEffect(() => {
    setQ(searchParams.get('q') || '')
  }, [searchParams])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) {
      nav(`/?q=${encodeURIComponent(trimmed)}`)
    } else {
      nav('/')
    }
  }

  return (
    <form onSubmit={onSearch} className="search-form">
      <input
        type="search"
        placeholder="Tìm kiếm phim..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </form>
  )
}

export function Layout() {
  const { user } = useAuth()

  return (
    <>
      <header className="top-nav">
        <div className="top-nav__inner">
          <Link to="/" className="logo">
            PHIM<span>HAY</span>
          </Link>
          <div className="top-nav__search">
            <SearchForm />
          </div>
          <nav className="top-nav__links">
            <div className="top-nav__main-actions">
              <Link to="/" className="nav-pill">
                Trang chủ
              </Link>
              <FilterDropdowns />
              {user && !user.isAdmin && !user.isVip && (
                <Link to="/vip" className="vip-link">
                  Nâng VIP
                </Link>
              )}
              {user && <UserMenu />}
            </div>
            {user?.isAdmin && <Link to="/admin">Admin</Link>}
            {!user && (
              <>
                <Link to="/login">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn--sm">
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
      <style>{`
        .top-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: #000;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid #262626;
        }
        .top-nav__inner {
          width: 100%;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 1rem;
        }
        .logo {
          font-weight: 800;
          font-size: 1.6rem;
          letter-spacing: -0.02em;
          color: var(--nf-red);
          justify-self: start;
        }
        .logo span {
          color: #fff;
        }
        .top-nav__search {
          display: flex;
          justify-content: center;
          min-width: 0;
        }
        .search-form {
          width: min(680px, 100%);
        }
        .search-form input {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #444;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          color: #fff;
          font-size: 0.9rem;
        }
        .search-form input::placeholder {
          color: #aaa;
        }
        .top-nav__links {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
          justify-self: end;
          justify-content: flex-end;
        }
        .top-nav__main-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .top-nav__links a:hover {
          color: #fff;
        }
        .nav-pill {
          background: transparent;
          color: #fff;
          border: 1px solid #444;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          line-height: 1;
          white-space: nowrap;
        }
        .nav-pill:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .vip-link {
          background: linear-gradient(90deg, #f7d46a, #f5c518);
          color: #111 !important;
          border-radius: 999px;
          padding: 0.45rem 0.95rem;
          font-weight: 800;
          border: 1px solid #c49a00;
          box-shadow: 0 2px 10px rgba(245, 197, 24, 0.35);
          line-height: 1;
          white-space: nowrap;
        }
        .btn--sm {
          padding: 0.4rem 0.85rem;
          font-size: 0.85rem;
        }
        .user-email {
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .badge-vip {
          background: linear-gradient(90deg, #f5c518, #e6a800);
          color: #111;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.2rem 0.45rem;
          border-radius: 4px;
        }

        .user-menu {
          position: relative;
        }

        .user-menu__button {
          background: none;
          border: 2px solid var(--nf-red);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          overflow: hidden;
        }

        .user-icon {
          width: 32px;
          height: 32px;
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          padding: 4px;
        }
        .user-icon path {
          stroke: #fff;
        }

        .badge-vip--outside {
          position: absolute;
          top: -5px;
          right: -10px;
        }

        .user-menu__dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: #222;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 0.5rem 0;
          z-index: 10;
          width: 200px;
        }

        .user-menu__dropdown ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .user-menu__dropdown li {
          padding: 0.5rem 1rem;
        }

        .user-menu__dropdown a,
        .user-menu__dropdown button {
          color: #fff;
          text-decoration: none;
          display: block;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
        }

        .user-menu__dropdown a:hover,
        .user-menu__dropdown button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .user-menu__user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: bold;
        }
        
        .user-menu__separator {
          height: 1px;
          background: #444;
          margin: 0.5rem 0;
          padding: 0;
        }
        @media (max-width: 1024px) {
          .top-nav__inner {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .logo,
          .top-nav__search,
          .top-nav__links {
            justify-self: stretch;
          }
          .top-nav__links,
          .top-nav__main-actions {
            justify-content: flex-start;
          }
          .search-form {
            width: 100%;
            max-width: none;
          }
        }
      `}</style>
    </>
  )
}
