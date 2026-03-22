import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export function PaymentReturn() {
  const [params] = useSearchParams()
  const { refreshMe } = useAuth()
  const success = params.get('success') === '1'

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  return (
    <div className="page">
      <h1>Kết quả thanh toán</h1>
      {success ? (
        <p>Cảm ơn bạn! VIP đã được kích hoạt (nếu giao dịch sandbox thành công).</p>
      ) : (
        <p className="muted">Giao dịch chưa thành công hoặc bị huỷ. Mã: {params.get('code') || '—'}</p>
      )}
      <Link to="/" className="btn btn-primary">
        Về trang chủ
      </Link>
    </div>
  )
}
