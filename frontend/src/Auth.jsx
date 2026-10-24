import { useState } from 'react'
import './Auth.css'
import * as api from './api.js'

export default function AuthPage({ onAuthenticated, notice = '' }) {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === 'signup'

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup')
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (isSignup) {
      if (!displayName.trim()) return setError('Please enter your name.')
      if (password.length < 8) return setError('Password must be at least 8 characters.')
      if (password !== confirmPassword) return setError('The two passwords do not match.')
    }

    setIsSubmitting(true)
    try {
      if (isSignup) {
        await api.signup({ displayName: displayName.trim(), email: email.trim(), password })
      } else {
        await api.login({ email: email.trim(), password })
      }
      onAuthenticated()
    } catch (caughtError) {
      setError(caughtError.message || 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 4 4L19 6" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <span>daymark<span className="brand-period">.</span></span>
        </div>

        <p className="eyebrow">{isSignup ? 'CREATE YOUR SPACE' : 'WELCOME BACK'}</p>
        <h1 id="auth-title">{isSignup ? 'Create your account' : 'Log in to your tasks'}</h1>

        {notice && !error && <p className="auth-notice" role="status">{notice}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <form className="auth-form" onSubmit={submit} noValidate>
          {isSignup && (
            <>
              <label className="form-label" htmlFor="auth-name">Your name</label>
              <input
                id="auth-name"
                className="task-input"
                type="text"
                autoComplete="name"
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Sam"
                autoFocus
              />
            </>
          )}

          <label className="form-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            className="task-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoFocus={!isSignup}
            required
          />

          <label className="form-label" htmlFor="auth-password">Password</label>
          <div className="auth-password">
            <input
              id="auth-password"
              className="task-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              required
            />
            <button
              className="auth-toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {isSignup && (
            <>
              <label className="form-label" htmlFor="auth-confirm">Confirm password</label>
              <input
                id="auth-confirm"
                className="task-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Type it again"
                required
              />
            </>
          )}

          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to daymark?'}{' '}
          <button type="button" onClick={switchMode}>{isSignup ? 'Log in' : 'Create an account'}</button>
        </p>
      </section>
    </main>
  )
}
