import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { MovieDetail } from './pages/MovieDetail'
import { Admin } from './pages/Admin'
import { Vip } from './pages/Vip'
import { PaymentReturn } from './pages/PaymentReturn'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/phim/:slug" element={<MovieDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/vip" element={<Vip />} />
            <Route path="/payment/return" element={<PaymentReturn />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
