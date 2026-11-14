import { useEffect, useState } from 'react'
import {
  finishElapsedAppointments,
  updateBookingDecision,
} from '../bookingStorage.js'
import AdminManagement from './AdminManagement.jsx'

const adminPasscode = '12341234'

function formatAppointmentTime(value) {
  const appointmentDate = new Date(value)
  if (Number.isNaN(appointmentDate.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(appointmentDate)
}

function AdminPage() {
  const [enteredPasscode, setEnteredPasscode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusError, setStatusError] = useState('')
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending')
  const waitingOrDeclinedBookings = bookings.filter(
    (booking) => booking.status !== 'pending',
  )

  useEffect(() => {
    if (!isAuthenticated) return undefined

    let isActive = true
    queueMicrotask(() => {
      if (!isActive) return
      refreshBookings()
      setIsLoading(false)
    })

    const intervalId = window.setInterval(refreshBookings, 30_000)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }

    function refreshBookings() {
      if (!isActive) return
      try {
        setBookings(finishElapsedAppointments())
        setStorageError('')
      } catch {
        setStorageError(
          'Saved bookings could not be read. Check browser storage, then refresh this page.',
        )
      }
    }
  }, [isAuthenticated])

  function handleSubmit(event) {
    event.preventDefault()
    if (enteredPasscode !== adminPasscode) {
      setAdminError('Incorrect passcode. Please try again.')
      setEnteredPasscode('')
      return
    }

    setAdminError('')
    setEnteredPasscode('')
    setIsLoading(true)
    setIsAuthenticated(true)
  }

  function handleLogout() {
    setIsAuthenticated(false)
    setBookings([])
    setStorageError('')
    setStatusError('')
  }

  function handleBookingDecision(bookingId, decision) {
    try {
      setBookings(updateBookingDecision(bookingId, decision))
      setStatusError('')
    } catch {
      setStatusError(
        'The booking status could not be saved. Check browser storage and try again.',
      )
    }
  }

  function renderBooking(booking) {
    return (
      <li className="booking-item" key={booking.id}>
        <div className="booking-item-heading">
          <h3>{booking.customerName}</h3>
          <time dateTime={booking.appointmentTime}>
            {formatAppointmentTime(booking.appointmentTime)}
          </time>
        </div>
        <div className="booking-status-field">
          <span className={`booking-status-badge is-${booking.status}`}>
            {booking.status === 'accepted'
              ? 'Accepted'
              : booking.status === 'declined'
                ? 'Declined'
                : booking.status === 'finished'
                  ? 'Finished'
                  : 'Pending'}
          </span>
          {booking.status === 'pending' && (
            <div className="booking-decision-actions" aria-label="Appointment decision">
              <button
                className="booking-decision-button is-accept"
                onClick={() => handleBookingDecision(booking.id, 'accepted')}
                type="button"
              >
                Accept
              </button>
              <button
                className="booking-decision-button is-decline"
                onClick={() => handleBookingDecision(booking.id, 'declined')}
                type="button"
              >
                Decline
              </button>
            </div>
          )}
        </div>
        <p className="booking-device">{booking.deviceModel}</p>
        <p className="booking-issue">{booking.issueDescription}</p>
      </li>
    )
  }

  return (
    <div className="app-shell admin-page">
      <header className="app-header admin-page-header">
        <a className="brand" href="/" aria-label="Return to Device Fix">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>device<span className="brand-accent">fix</span></span>
        </a>
        {isAuthenticated ? (
          <button className="admin-lock-button" onClick={handleLogout} type="button">
            Lock admin page
          </button>
        ) : (
          <a className="back-to-site" href="/">Back to booking page</a>
        )}
      </header>

      <main className="main-content">
        <section className="welcome-panel" aria-labelledby="admin-page-title">
          <p className="eyebrow">STAFF AREA</p>
          <h1 id="admin-page-title">Administration</h1>
          <p className="welcome-copy">
            Manage repair bookings, customer accounts, and troubleshooting guides.
          </p>
        </section>

        {!isAuthenticated ? (
          <section className="admin-page-panel" aria-labelledby="admin-login-title">
            <h2 id="admin-login-title">Admin sign in</h2>
            <p>Enter the admin passcode to manage bookings, users, and troubleshooting guides.</p>
            <form className="admin-page-login-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="admin-page-passcode">Admin passcode</label>
                <input
                  autoComplete="current-password"
                  autoFocus
                  id="admin-page-passcode"
                  inputMode="numeric"
                  onChange={(event) => {
                    setEnteredPasscode(event.target.value)
                    setAdminError('')
                  }}
                  required
                  type="password"
                  value={enteredPasscode}
                />
              </div>
              <button className="submit-button" type="submit">Open admin</button>
              {adminError && <p className="form-error" role="alert">{adminError}</p>}
            </form>
          </section>
        ) : (
          <>
          <section className="admin-page-panel" aria-labelledby="booking-list-title">
            <div className="booking-list-heading">
              <div>
                <h2 id="booking-list-title">Saved bookings</h2>
                <p>{bookings.length} {bookings.length === 1 ? 'appointment' : 'appointments'}</p>
              </div>
            </div>
            {storageError && <p className="storage-message" role="alert">{storageError}</p>}
            {statusError && <p className="storage-message" role="alert">{statusError}</p>}
            {isLoading ? (
              <p className="empty-bookings">Loading saved bookings…</p>
            ) : bookings.length === 0 ? (
              <p className="empty-bookings">There are no saved bookings yet.</p>
            ) : (
              <div className="booking-groups">
                <details className="booking-group" open>
                  <summary>
                    <span>Pending requests</span>
                    <span className="booking-group-count">{pendingBookings.length}</span>
                  </summary>
                  {pendingBookings.length > 0 ? (
                    <ul className="booking-list-items">
                      {pendingBookings.map(renderBooking)}
                    </ul>
                  ) : (
                    <p className="empty-bookings booking-group-empty">
                      No pending requests.
                    </p>
                  )}
                </details>

                <details className="booking-group">
                  <summary>
                    <span>Waiting/declined requests</span>
                    <span className="booking-group-count">
                      {waitingOrDeclinedBookings.length}
                    </span>
                  </summary>
                  {waitingOrDeclinedBookings.length > 0 ? (
                    <ul className="booking-list-items">
                      {waitingOrDeclinedBookings.map(renderBooking)}
                    </ul>
                  ) : (
                    <p className="empty-bookings booking-group-empty">
                      No waiting or declined requests.
                    </p>
                  )}
                </details>
              </div>
            )}
          </section>
          <AdminManagement />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Device Fix <span aria-hidden="true">·</span> Admin page</p>
      </footer>
    </div>
  )
}

export default AdminPage
