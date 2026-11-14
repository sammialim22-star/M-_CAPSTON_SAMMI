export const BOOKINGS_STORAGE_KEY = 'device-fix-bookings'
export const BOOKING_STATUSES = ['pending', 'accepted', 'declined', 'finished']

function formatTimeSlot(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export const APPOINTMENT_HOURS = [
  ...[3, ...Array.from({ length: 8 }, (_, index) => index + 9)].map(
    (hour) => ({
      value: `${String(hour).padStart(2, '0')}:00`,
      label: formatTimeSlot(`${String(hour).padStart(2, '0')}:00`),
    }),
  ),
  { value: '25:00', label: '1:00 AM (next day)' },
]

export function isBooking(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.customerName === 'string' &&
    typeof value.deviceModel === 'string' &&
    typeof value.issueDescription === 'string' &&
    typeof value.appointmentTime === 'string' &&
    (value.status === undefined ||
      BOOKING_STATUSES.includes(value.status) ||
      value.status === 'in-appointment')
  )
}

export function readBookings() {
  const savedValue = window.localStorage.getItem(BOOKINGS_STORAGE_KEY)
  if (savedValue === null) return []

  const bookings = JSON.parse(savedValue)
  if (!Array.isArray(bookings) || !bookings.every(isBooking)) {
    throw new Error('Saved booking data has an unexpected format.')
  }

  return bookings.map((booking) => ({
    ...booking,
    status:
      booking.status === 'in-appointment'
        ? 'accepted'
        : booking.status ?? 'pending',
  }))
}

export function saveBookings(bookings) {
  window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings))
}

export function updateBookingDecision(bookingId, decision, now = Date.now()) {
  if (!['accepted', 'declined'].includes(decision)) {
    throw new Error('Unsupported booking decision.')
  }

  const bookings = readBookings()
  const bookingExists = bookings.some((booking) => booking.id === bookingId)
  if (!bookingExists) {
    throw new Error('The booking could not be found.')
  }

  const updatedBookings = bookings.map((booking) => {
    if (booking.id !== bookingId) return booking

    const appointmentStart = new Date(booking.appointmentTime).getTime()
    const status =
      decision === 'accepted' &&
      !Number.isNaN(appointmentStart) &&
      appointmentStart + 60 * 60 * 1000 <= now
        ? 'finished'
        : decision
    return { ...booking, status }
  })
  saveBookings(updatedBookings)
  return updatedBookings
}

export function finishElapsedAppointments(now = Date.now()) {
  const bookings = readBookings()
  let changed = false
  const updatedBookings = bookings.map((booking) => {
    if (booking.status !== 'accepted') return booking

    const appointmentStart = new Date(booking.appointmentTime).getTime()
    if (
      Number.isNaN(appointmentStart) ||
      appointmentStart + 60 * 60 * 1000 > now
    ) {
      return booking
    }

    changed = true
    return { ...booking, status: 'finished' }
  })

  if (changed) saveBookings(updatedBookings)
  return updatedBookings
}

export function getSlotStart(date, time) {
  const [hours, minutes] = time.split(':').map(Number)
  const slotStart = new Date(`${date}T00:00:00`)
  slotStart.setHours(hours, minutes, 0, 0)
  return slotStart
}

export function getLocalDateValue(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export function getOneMonthLater(date) {
  const nextMonth = date.getMonth() + 1
  const lastDayOfNextMonth = new Date(
    date.getFullYear(),
    nextMonth + 1,
    0,
  ).getDate()
  return getLocalDateValue(
    new Date(
      date.getFullYear(),
      nextMonth,
      Math.min(date.getDate(), lastDayOfNextMonth),
    ),
  )
}

export function isTimeSlotAvailable(bookings, date, time) {
  const slotStartDate = getSlotStart(date, time)
  const slotStart = slotStartDate.getTime()
  if (Number.isNaN(slotStart)) return false

  const slotEnd = slotStart + 60 * 60 * 1000
  return !bookings.some((booking) => {
    const bookingStart = new Date(booking.appointmentTime).getTime()
    if (Number.isNaN(bookingStart)) return false

    const bookingEnd = bookingStart + 60 * 60 * 1000
    return slotStart < bookingEnd && slotEnd > bookingStart
  })
}

export function getAvailableHours(bookings, date, currentTime, lastReservationDate) {
  return APPOINTMENT_HOURS.filter(({ value }) => {
    const slotStart = getSlotStart(date, value)
    return (
      slotStart.getTime() > currentTime &&
      getLocalDateValue(slotStart) <= lastReservationDate &&
      isTimeSlotAvailable(bookings, date, value)
    )
  })
}
