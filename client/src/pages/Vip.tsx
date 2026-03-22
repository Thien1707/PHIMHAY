import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function Vip() {
  const { user, loading, isVipActive } = useAuth()
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="page muted">…</p>
  if (!user) return <Navigate to="/login" replace />

  async function pay() {
    setErr(null)
    setBusy(true)
    try {
      const d = await api<{ payUrl: string }>('/api/payment/vnpay-create', { method: 'POST' })
      window.location.href = d.payUrl
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page vip-page">
      <h1>Nâng cấp VIP</h1>
      {isVipActive() ? (
        <p>
          Bạn đang là VIP
          {user.vipExpiresAt ? ` đến ${new Date(user.vipExpiresAt).toLocaleDateString()}` : ''}.
        </p>
      ) : (
        <>
          <p>Thanh toán sandbox VNPay để mở khóa phim VIP và xem không giới hạn theo gói.</p>
          <p className="muted">Cấu hình biến môi trường VNP_TMN_CODE, VNP_HASH_SECRET, VNP_RETURN_URL trên server.</p>
          {err && <p className="error-text">{err}</p>}
          <button type="button" className="btn btn-primary" onClick={pay} disabled={busy}>
            {busy ? '…' : 'Thanh toán VNPay (sandbox)'}
          </button>
        </>
      )}
    </div>
  )
}
