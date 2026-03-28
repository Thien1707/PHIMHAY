import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()

  const handleLogout = () => {
    logout()
    nav('/')
    setIsOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuRef])

  if (!user) return null

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu__button" onClick={() => setIsOpen(!isOpen)}>
        <svg
          className="user-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          width="24px"
          height="24px"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </button>
      {user.isVip && <span className="badge-vip badge-vip--outside">VIP</span>}

      {isOpen && (
        <div className="user-menu__dropdown">
          <ul>
            <li className="user-menu__user-info">
              <span>{user.displayName || user.email}</span>
            </li>
            <li>
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                Tài khoản & Cài đặt
              </Link>
            </li>
            <li className="user-menu__separator" />
            <li>
              <button onClick={handleLogout}>Đăng xuất</button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
