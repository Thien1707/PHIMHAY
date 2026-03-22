import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

type MovieDoc = {
  _id: string
  slug: string
  title: string
  viewStatus: number
  commentRatingPolicy: 'public' | 'members'
  isActive: boolean
}

export function Admin() {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<MovieDoc[]>([])
  const [slug, setSlug] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const d = await api<{ items: MovieDoc[] }>('/api/admin/movies')
    setItems(d.items)
  }

  useEffect(() => {
    if (!user?.isAdmin) return
    load().catch((e: Error) => setErr(e.message))
  }, [user?.isAdmin])

  if (loading) return <p className="page muted">…</p>
  if (!user?.isAdmin) return <Navigate to="/" replace />

  async function importSlug(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await api('/api/admin/movies/import', { method: 'POST', json: { slug: slug.trim() } })
      setSlug('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setErr(null)
    try {
      await api(`/api/admin/movies/${id}`, { method: 'PATCH', json: body })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa phim khỏi catalog?')) return
    setErr(null)
    try {
      await api(`/api/admin/movies/${id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  return (
    <div className="page admin-page">
      <h1>Admin — CRUD phim</h1>
      <p className="muted">Import theo slug từ phimapi (ví dụ: ngoi-truong-xac-song).</p>
      {err && <p className="error-text">{err}</p>}
      <form onSubmit={importSlug} className="import-form">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug phimapi" required />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Import
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Slug</th>
            <th>View</th>
            <th>Bình luận/đánh giá</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m._id}>
              <td>{m.title}</td>
              <td className="muted">{m.slug}</td>
              <td>
                <select
                  value={m.viewStatus}
                  onChange={(e) => patch(m._id, { viewStatus: Number(e.target.value) })}
                >
                  <option value={0}>NORMAL (user + VIP)</option>
                  <option value={1}>VIP only</option>
                </select>
              </td>
              <td>
                <select
                  value={m.commentRatingPolicy}
                  onChange={(e) => patch(m._id, { commentRatingPolicy: e.target.value })}
                >
                  <option value="public">Public (guest xem được)</option>
                  <option value="members">Members (chỉ user đăng nhập)</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={m.isActive}
                  onChange={(e) => patch(m._id, { isActive: e.target.checked })}
                />
              </td>
              <td>
                <button type="button" className="btn btn-ghost btn--sm" onClick={() => remove(m._id)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .import-form {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .import-form input {
          flex: 1;
          min-width: 200px;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .admin-table th,
        .admin-table td {
          border-bottom: 1px solid #222;
          padding: 0.5rem 0.35rem;
          text-align: left;
          vertical-align: middle;
        }
        .admin-table select {
          max-width: 180px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  )
}
