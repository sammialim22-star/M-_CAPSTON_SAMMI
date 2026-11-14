import { useEffect, useState } from 'react'
import { logout, readCurrentAccount } from './accountStorage.js'
import AppHeader from './components/AppHeader.jsx'
import AccountAccess from './components/AccountAccess.jsx'
import AdminPage from './components/AdminPage.jsx'
import BookingForm from './components/BookingForm.jsx'
import Troubleshooter from './components/Troubleshooter.jsx'
import './App.css'

const views = {
  guides: {
    title: 'Troubleshoot a device',
    description:
      'Choose a common issue to see practical checks and step-by-step guidance.',
  },
  booking: {
    title: 'Book a repair',
    description:
      'Tell us what is going on with your device and find a time for a repair.',
  },
}

function App() {
  const [activeView, setActiveView] = useState('guides')
  const [account, setAccount] = useState(null)
  const [accountReady, setAccountReady] = useState(false)
  const [accountStorageError, setAccountStorageError] = useState('')
  const view = views[activeView]

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (!isActive) return
      try {
        setAccount(readCurrentAccount())
      } catch {
        setAccountStorageError(
          'Browser account storage is unavailable. Enable storage for this site and refresh.',
        )
      }
      setAccountReady(true)
    })

    return () => {
      isActive = false
    }
  }, [])

  if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
    return <AdminPage />
  }

  function handleLogout() {
    try {
      logout()
      setAccount(null)
      setAccountStorageError('')
    } catch {
      setAccountStorageError(
        'Could not log out because browser storage is unavailable. Close this tab to end the demo session.',
      )
    }
  }

  return (
    <div className="app-shell">
      <AppHeader
        activeView={activeView}
        onLogout={handleLogout}
        onViewChange={setActiveView}
        username={account?.username}
      />

      <main className="main-content">
        <section className="welcome-panel" aria-labelledby="page-title">
          <p className="eyebrow">DEVICE CARE, MADE SIMPLE</p>
          <h1 id="page-title">{view.title}</h1>
          <p className="welcome-copy">{view.description}</p>
        </section>

        {activeView === 'guides' ? (
          <Troubleshooter onBookAppointment={() => setActiveView('booking')} />
        ) : !accountReady ? (
          <section className="account-panel" aria-live="polite">
            <p>Checking your account…</p>
          </section>
        ) : account ? (
          <BookingForm
            accountUsername={account.username}
            onLogout={handleLogout}
          />
        ) : (
          <AccountAccess
            onAccountReady={setAccount}
            storageError={accountStorageError}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Device Fix <span aria-hidden="true">·</span> Help for the devices you rely on</p>
      </footer>
    </div>
  )
}

export default App
