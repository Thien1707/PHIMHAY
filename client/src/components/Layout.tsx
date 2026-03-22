import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <>
      <header className="top-nav">
        <div className="top-nav__inner">
          <Link to="/" className="logo">
            PHIM<span>HAY</span>
          </Link>
          <nav className="top-nav__links">
            <Link to="/">Trang chủ</Link>
            {user?.isAdmin && <Link to="/admin">Admin</Link>}
            {user && (
              <Link to="/vip" className="vip-link">
                Nâng VIP
              </Link>
            )}
            {!user && (
              <>
                <Link to="/login">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn--sm">
                  Đăng ký
                </Link>
              </>
            )}
            {user && (
              <>
                <span className="muted user-email">{user.email}</span>
                {user.isVip && <span className="badge-vip">VIP</span>}
                <button
                  type="button"
                  className="btn btn-ghost btn--sm"
                  onClick={() => {
                    logout()
                    nav('/')
                  }}
                >
                  Thoát
                </button>
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
          background: linear-gradient(180deg, rgba(0,0,0,0.92) 0%, transparent 100%);
          padding: 0.75rem 1.25rem;
        }
        .top-nav__inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .logo {
          font-weight: 800;
          font-size: 1.35rem;
          letter-spacing: -0.02em;
          color: var(--nf-red);
        }
        .logo span {
          color: #fff;
        }
        .top-nav__links {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
        }
        .top-nav__links a:hover {
          color: #fff;
        }
        .vip-link {
          color: #f5c518;
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
      `}</style>
    </>
  )
}
