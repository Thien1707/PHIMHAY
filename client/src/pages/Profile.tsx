import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

type ProfileForm = {
  displayName: string
  email: string
  phoneNumber: string
  password: string
  dateOfBirth: string
  gender: '' | 'male' | 'female' | 'other'
}

function toInputDate(d: string | null | undefined) {
  if (!d) return ''
  // Expecting ISO-like string `YYYY-MM-DD` or a full ISO date.
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toISOString().slice(0, 10)
}

export function Profile() {
  const { user, loading, refreshMe } = useAuth()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const initialForm = useMemo<ProfileForm>(() => {
    const gender = user?.gender === 'male' || user?.gender === 'female' || user?.gender === 'other' ? user.gender : ''
    return {
      displayName: user?.displayName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      password: '',
      dateOfBirth: toInputDate(user?.dateOfBirth),
      gender: (gender || '') as ProfileForm['gender']
    }
  }, [user])

  const [form, setForm] = useState<ProfileForm>(initialForm)

  useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  if (loading) return <p className="page muted">…</p>
  if (!user) return <Navigate to="/login" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setSuccess(null)

    const payload: Record<string, unknown> = {
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      dateOfBirth: form.dateOfBirth ? form.dateOfBirth : null,
      gender: form.gender
    }

    if (form.password.trim()) {
      payload.password = form.password
    }

    if (!payload.displayName) return setErr('Vui lòng nhập Account Name')
    if (!payload.email) return setErr('Vui lòng nhập Email')

    setBusy(true)
    try {
      await api('/api/auth/me', { method: 'PUT', json: payload })
      await refreshMe()
      setForm((prev) => ({ ...prev, password: '' }))
      setSuccess('Cập nhật thông tin thành công')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Cập nhật thất bại')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Tài khoản</h1>
        <form onSubmit={onSubmit}>
          <label>
            Account Name
            <input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} />
          </label>

          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </label>

          <label>
            Phone Number
            <input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="(Để trống nếu không muốn đổi)"
              autoComplete="new-password"
            />
          </label>

          <label>
            Date of Birth
            <input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
          </label>

          <label>
            Gender
            <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as ProfileForm['gender'] }))}>
              <option value="">(Chưa đặt)</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </label>

          {err && <p className="error-text">{err}</p>}
          {success && <p className="success-text">{success}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>

      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 90px;
        }
        .auth-card {
          width: 100%;
          max-width: 520px;
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
        .auth-card input,
        .auth-card select {
          width: 100%;
          margin-top: 0.35rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #444;
          border-radius: 6px;
          padding: 0.55rem 0.7rem;
          color: #fff;
          font-size: 0.95rem;
        }
        .auth-card select {
          background-color: #111;
          color: #fff;
          appearance: none;
        }
        .auth-card select option {
          background-color: #111;
          color: #fff;
        }
        .auth-submit {
          width: 100%;
          margin-top: 0.5rem;
        }
        .success-text {
          color: #34d399;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  )
}

