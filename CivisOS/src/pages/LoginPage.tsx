import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, ErrorBanner, Input } from '../components/ui'
import logo from '../assets/logo.jpg'

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [email, setEmail] = useState('admin@civisos.local')
  const [password, setPassword] = useState('Admin@12345')
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero" style={{ backgroundImage: `linear-gradient(135deg, rgba(8,28,36,.72), rgba(12,58,46,.55)), url(${logo})` }}>
        <div>
          <p className="eyebrow">CivisOS</p>
          <h1>Operate your society from one console.</h1>
          <p>Attendance, fleet, cleaning, tasks, and live alerts — connected to your API.</p>
        </div>
      </div>
      <Card className="login-card">
        <h2>Sign in</h2>
        <p className="muted">Use your CivisOS account</p>
        {error ? <ErrorBanner message={error} /> : null}
        <form onSubmit={onSubmit} className="form-stack">
          <label>
            Email
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            Password
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
