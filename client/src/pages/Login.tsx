import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await login(email, password)
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
        <h1>Đăng nhập</h1>
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
              autoComplete="current-password"
            />
          </label>
          {err && <p className="error-text">{err}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? '…' : 'Đăng nhập'}
          </button>
        </form>
        <p className="muted">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: flex-start;
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
