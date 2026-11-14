import { useEffect, useState } from 'react'
import {
  getAvailableHours,
  getLocalDateValue,
  getOneMonthLater,
  getSlotStart,
  isTimeSlotAvailable,
  readBookings,
  saveBookings,
} from '../bookingStorage.js'
import {
  deviceModelOptions,
  getDeviceModelError,
} from '../deviceValidation.js'

const initialForm = {
  customerName: '',
  deviceModel: '',
  issueDescription: '',
}

function formatTimeSlot(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function BookingForm({ accountUsername, onLogout }) {
  const [formValues, setFormValues] = useState(initialForm)
  const [bookings, setBookings] = useState([])
  const [storageReady, setStorageReady] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [formError, setFormError] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isOtherDeviceModel, setIsOtherDeviceModel] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const currentDate = new Date(currentTime)
  const today = getLocalDateValue(currentDate)
  const lastReservationDate = getOneMonthLater(currentDate)
  const deviceModelError = getDeviceModelError(formValues.deviceModel)

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (!isActive) return

      try {
        setBookings(readBookings())
      } catch {
        setStorageError(
          'Saved bookings could not be read. Check browser storage, then refresh the page.',
        )
      }
      setStorageReady(true)
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const availableHours = appointmentDate
    ? getAvailableHours(bookings, appointmentDate, currentTime, lastReservationDate)
    : []

  function handleChange(event) {
    const { name, value } = event.target
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }))
    setFormError('')
    setSuccessMessage('')
  }

  function handleDateChange(event) {
    setAppointmentDate(event.target.value)
    setSelectedTime('')
    setFormError('')
    setSuccessMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setHasSubmitted(true)
    const customerName = formValues.customerName.trim()
    const deviceModel = formValues.deviceModel.trim()
    const issueDescription = formValues.issueDescription.trim()

    if (deviceModelError) {
      setFormError(deviceModelError)
      return
    }
    if (!customerName || !deviceModel || !issueDescription) {
      setFormError('Please complete every field before submitting.')
      return
    }
    if (!appointmentDate || !selectedTime) {
      setFormError('Choose an appointment date and an available time.')
      return
    }
    if (appointmentDate < today || appointmentDate > lastReservationDate) {
      setFormError('Choose a date within the next month.')
      return
    }

    try {
      const currentBookings = readBookings()
      if (!isTimeSlotAvailable(currentBookings, appointmentDate, selectedTime)) {
        setBookings(currentBookings)
        setSelectedTime('')
        setFormError('That time was just booked. Please choose another available time.')
        return
      }

      const newBooking = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        accountUsername,
        customerName,
        deviceModel,
        issueDescription,
        appointmentTime: (() => {
          const slotStart = getSlotStart(appointmentDate, selectedTime)
          const slotDate = getLocalDateValue(slotStart)
          const slotTime = `${String(slotStart.getHours()).padStart(2, '0')}:${String(
            slotStart.getMinutes(),
          ).padStart(2, '0')}`
          return `${slotDate}T${slotTime}`
        })(),
      }
      const updatedBookings = [newBooking, ...currentBookings]
      saveBookings(updatedBookings)
      setBookings(updatedBookings)
      setStorageError('')
      setFormError('')
      setSuccessMessage('Your one-hour appointment has been saved on this device.')
      setFormValues(initialForm)
      setAppointmentDate('')
      setSelectedTime('')
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'QuotaExceededError'
          ? 'Your appointment could not be saved because browser storage is full.'
          : 'Your appointment could not be saved. Check your browser storage settings and try again.'
      setStorageError(message)
    }
  }

  return (
    <section className="booking-panel" aria-labelledby="booking-form-title">
      <div className="booking-intro">
        <p className="eyebrow">APPOINTMENT DETAILS</p>
        <h2 id="booking-form-title">Tell us about your device</h2>
        <p>Choose a date, then select an available one-hour repair appointment.</p>
        <div className="booking-account-bar">
          <p>Booking as <strong>{accountUsername}</strong></p>
          <button className="back-to-site" onClick={onLogout} type="button">
            Log out
          </button>
        </div>
      </div>

      {storageError && <p className="storage-message" role="alert">{storageError}</p>}

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="customer-name">Your name</label>
          <input
            autoComplete="name"
            id="customer-name"
            maxLength={100}
            name="customerName"
            onChange={handleChange}
            required
            value={formValues.customerName}
          />
        </div>

        <div className="form-field">
          <label htmlFor="device-model">Device model</label>
          <select
            id="device-model"
            name="deviceModel"
            onChange={(event) => {
              const { value } = event.target
              setIsOtherDeviceModel(value === 'other')
              setFormValues((currentValues) => ({
                ...currentValues,
                deviceModel: value === 'other' ? '' : value,
              }))
              setFormError('')
              setSuccessMessage('')
            }}
            aria-describedby="device-model-hint"
            aria-invalid={hasSubmitted && Boolean(deviceModelError)}
            aria-required="true"
            value={isOtherDeviceModel ? 'other' : formValues.deviceModel}
          >
            <option value="">Choose a device</option>
            {deviceModelOptions.map(({ brand, models }) => (
              <optgroup key={brand} label={brand}>
                {models.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </optgroup>
            ))}
            <option value="other">Other (enter model)</option>
          </select>
          <span className="field-hint" id="device-model-hint">
            Choose a model, or select Other to enter one from a listed brand.
          </span>
          {isOtherDeviceModel && (
            <input
              aria-describedby="device-model-hint"
              aria-invalid={hasSubmitted && Boolean(deviceModelError)}
              autoComplete="off"
              autoFocus
              maxLength={120}
              name="deviceModel"
              onChange={handleChange}
              placeholder="Enter brand and model, e.g. iPhone 17 Pro"
              required
              value={formValues.deviceModel}
            />
          )}
          {hasSubmitted && deviceModelError && (
            <p className="form-error" role="alert">{deviceModelError}</p>
          )}
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="issue-description">What issue are you experiencing?</label>
          <textarea
            id="issue-description"
            maxLength={1000}
            name="issueDescription"
            onChange={handleChange}
            required
            rows={4}
            value={formValues.issueDescription}
          />
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="appointment-date">Preferred appointment date</label>
          <input
            id="appointment-date"
            max={lastReservationDate}
            min={today}
            name="appointmentDate"
            onChange={handleDateChange}
            required
            type="date"
            value={appointmentDate}
          />
          {appointmentDate && (
            <div className="time-slot-picker" aria-live="polite">
              <span className="time-slot-label">Available start times</span>
              {availableHours.length > 0 ? (
                <div className="time-slot-grid" role="group" aria-label="Available appointment times">
                  {availableHours.map(({ value, label }) => (
                    <button
                      aria-pressed={selectedTime === value}
                      className={`time-slot-button${selectedTime === value ? ' is-selected' : ''}`}
                      key={value}
                      onClick={() => {
                        setSelectedTime(value)
                        setFormError('')
                        setSuccessMessage('')
                      }}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="no-time-slots">
                  No available appointments on this date. Please choose another date.
                </p>
              )}
              {selectedTime && (
                <p className="selected-time">
                  Selected: {formatTimeSlot(selectedTime)} on{' '}
                  {getLocalDateValue(getSlotStart(appointmentDate, selectedTime)) === appointmentDate
                    ? 'the selected date'
                    : 'the following day'}{' '}
                  (one hour)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="form-actions form-field-wide">
          <button
            className="submit-button"
            disabled={!storageReady}
            type="submit"
          >
            Save appointment
          </button>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          {successMessage && <p className="form-status" role="status">{successMessage}</p>}
        </div>
      </form>

      <section className="booking-location" aria-labelledby="booking-location-title">
        <div>
          <p className="eyebrow">REPAIR AREA</p>
          <h2 id="booking-location-title">Apple Store Cotai Strip</h2>
          <p>View the appointment area on Google Maps.</p>
        </div>
        <div
          className="mk-map-node-element"
          style={{ width: '334px', height: '220px' }}
        >
          <div className="mk-annotation-container mk-dark-mode">
            <div slot="mk-slot-ohg735nb">
              <iframe
                title="Booking area on maps"
                src="https://www.google.com/maps?q=Apple+Cotai+Strip&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
          <div
            className="mk-controls-container mk-color-scheme-dark mk-dark-mode"
            style={{ inset: '0px' }}
          />
        </div>
      </section>
    </section>
  )
}

export default BookingForm
