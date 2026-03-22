import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [adminSecret, setAdminSecret] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await register(email, password, displayName || undefined, adminSecret || undefined)
      nav('/')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Đăng ký</h1>
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
          </label>
          <label>
            Mật khẩu
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Tên hiển thị (tuỳ chọn)
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label>
            Admin secret (chỉ dùng lần đầu, nếu có)
            <input
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              type="password"
              autoComplete="off"
            />
          </label>
          {err && <p className="error-text">{err}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? '…' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="muted">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: rgba(0, 0, 0, 0.75);
          padding: 2rem;
          border-radius: 8px;
          border: 1px solid #333;
        }
        .auth-card h1 {
          margin-top: 0;
        }
        .auth-card label {
          display: block;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .auth-submit {
          width: 100%;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  )
}
