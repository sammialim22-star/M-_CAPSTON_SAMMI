import { useState } from 'react'
import { createAccount, login, validateUsername } from '../accountStorage.js'

function AccountAccess({ onAccountReady, storageError = '' }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isCreatingAccount = mode === 'create'

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!validateUsername(username)) {
      setErrorMessage(
        'Use 3–30 letters, numbers, underscores, or hyphens for your username.',
      )
      return
    }

    if (password.length < 8) {
      setErrorMessage('Your password must be at least 8 characters.')
      return
    }

    if (isCreatingAccount && password !== confirmPassword) {
      setErrorMessage('The passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const account = isCreatingAccount
        ? await createAccount(username, password)
        : await login(username, password)
      setPassword('')
      setConfirmPassword('')
      onAccountReady(account)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Your account request could not be completed. Try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setErrorMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <section className="account-panel" aria-labelledby="account-panel-title">
      <div className="account-panel-intro">
        <p className="eyebrow">ACCOUNT REQUIRED</p>
        <h2 id="account-panel-title">
          {isCreatingAccount ? 'Create your account' : 'Log in to book'}
        </h2>
        <p>
          {isCreatingAccount
            ? 'Create an account to continue to appointment booking.'
            : 'Log in or create an account before booking an appointment.'}
        </p>
      </div>

      <div className="account-mode-tabs" role="group" aria-label="Account action">
        <button
          aria-pressed={!isCreatingAccount}
          className={!isCreatingAccount ? 'is-active' : ''}
          onClick={() => changeMode('login')}
          type="button"
        >
          Log in
        </button>
        <button
          aria-pressed={isCreatingAccount}
          className={isCreatingAccount ? 'is-active' : ''}
          onClick={() => changeMode('create')}
          type="button"
        >
          Create account
        </button>
      </div>

      {storageError && <p className="storage-message" role="alert">{storageError}</p>}

      <form className="account-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="account-username">Username</label>
          <input
            autoComplete="username"
            id="account-username"
            maxLength={30}
            minLength={3}
            onChange={(event) => {
              setUsername(event.target.value)
              setErrorMessage('')
            }}
            pattern="[A-Za-z0-9_-]{3,30}"
            required
            value={username}
          />
          <span className="field-hint">3–30 letters, numbers, _ or -</span>
        </div>

        <div className="form-field">
          <label htmlFor="account-password">Password</label>
          <input
            autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
            id="account-password"
            minLength={8}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrorMessage('')
            }}
            required
            type="password"
            value={password}
          />
          {isCreatingAccount && (
            <span className="field-hint">At least 8 characters</span>
          )}
        </div>

        {isCreatingAccount && (
          <div className="form-field">
            <label htmlFor="confirm-account-password">Confirm password</label>
            <input
              autoComplete="new-password"
              id="confirm-account-password"
              minLength={8}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setErrorMessage('')
              }}
              required
              type="password"
              value={confirmPassword}
            />
          </div>
        )}

        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <button className="submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? 'Please wait…'
            : isCreatingAccount
              ? 'Create account'
              : 'Log in'}
        </button>
      </form>

      <p className="account-demo-notice">
        Demo accounts are stored only in this browser and are not shared across devices.
      </p>
    </section>
  )
}

export default AccountAccess
