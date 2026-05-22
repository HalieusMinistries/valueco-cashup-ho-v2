import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { login } from '../api/client'

export default function LoginGate() {
  const { setAuthed } = useApp()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function doLogin() {
    if (!user || !pass) return
    setLoading(true)
    setError(false)
    try {
      const ok = await login(user, pass)
      if (ok) {
        setAuthed(true)
      } else {
        setError(true)
        setPass('')
      }
    } catch {
      setError(true)
      setPass('')
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doLogin()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
    }}>
      <div style={{
        background: 'var(--sur)', border: '1px solid var(--brd)',
        borderRadius: 8, padding: 40, width: 320, textAlign: 'center'
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 600, color: 'var(--acc)', marginBottom: 6 }}>
          VC // CASHUP
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt2)', marginBottom: 28, textTransform: 'uppercase', letterSpacing: 1 }}>
          Head Office Portal
        </div>
        <input
          type="text"
          placeholder="Username"
          value={user}
          onChange={e => setUser(e.target.value)}
          onKeyDown={onKey}
          style={{
            width: '100%', padding: 10, background: 'var(--sur2)',
            border: '1px solid var(--brd)', color: 'var(--txt)',
            fontFamily: 'var(--mono)', fontSize: 12, borderRadius: 4,
            marginBottom: 10, boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={onKey}
          style={{
            width: '100%', padding: 10, background: 'var(--sur2)',
            border: '1px solid var(--brd)', color: 'var(--txt)',
            fontFamily: 'var(--mono)', fontSize: 12, borderRadius: 4,
            marginBottom: 16, boxSizing: 'border-box'
          }}
        />
        {error && (
          <div style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 10, marginBottom: 10 }}>
            Invalid credentials. Access denied.
          </div>
        )}
        <button
          onClick={doLogin}
          disabled={loading}
          style={{
            width: '100%', padding: 10, background: 'var(--acc)',
            border: 'none', color: '#fff', fontFamily: 'var(--mono)',
            fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'AUTHENTICATING...' : 'LOGIN'}
        </button>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt2)', marginTop: 20, lineHeight: 1.5 }}>
          This system logs application activity for support and troubleshooting purposes.
        </div>
      </div>
    </div>
  )
}