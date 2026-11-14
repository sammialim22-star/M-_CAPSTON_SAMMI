import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  APPOINTMENT_HOURS,
  BOOKINGS_STORAGE_KEY,
  getAvailableHours,
  getLocalDateValue,
  getOneMonthLater,
  getSlotStart,
  isTimeSlotAvailable,
  readBookings,
  saveBookings,
  finishElapsedAppointments,
  updateBookingDecision,
} from './bookingStorage.js'

const originalWindow = globalThis.window

afterEach(() => {
  if (originalWindow === undefined) {
    delete globalThis.window
  } else {
    globalThis.window = originalWindow
  }
})

function makeBooking(appointmentTime) {
  return {
    id: 'booking-1',
    customerName: 'Test customer',
    deviceModel: 'Test device',
    issueDescription: 'Test issue',
    appointmentTime,
  }
}

function formatLocalDateTime(date) {
  return `${getLocalDateValue(date)}T${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

test('offers the configured 3 AM and following-day 1 AM slots', () => {
  assert.ok(APPOINTMENT_HOURS.some(({ value }) => value === '03:00'))
  assert.deepEqual(
    APPOINTMENT_HOURS.find(({ value }) => value === '25:00'),
    { value: '25:00', label: '1:00 AM (next day)' },
  )
})

test('maps the 25:00 slot onto 1 AM on the following calendar day', () => {
  const slotStart = getSlotStart('2030-01-15', '25:00')
  assert.equal(getLocalDateValue(slotStart), '2030-01-16')
  assert.equal(slotStart.getHours(), 1)
})

test('blocks a next-day appointment when an existing booking overlaps it', () => {
  const nextDayAtOneAm = getSlotStart('2030-01-15', '25:00')
  const bookings = [makeBooking(formatLocalDateTime(nextDayAtOneAm))]

  assert.equal(isTimeSlotAvailable(bookings, '2030-01-15', '25:00'), false)
  assert.equal(isTimeSlotAvailable(bookings, '2030-01-15', '03:00'), true)
})

test('only returns future, unbooked slots within the reservation range', () => {
  const date = '2030-01-15'
  const currentTime = getSlotStart(date, '10:00').getTime()
  const bookings = [
    makeBooking(formatLocalDateTime(getSlotStart(date, '11:00'))),
  ]
  const available = getAvailableHours(
    bookings,
    date,
    currentTime,
    '2030-02-15',
  )

  assert.ok(!available.some(({ value }) => value === '10:00'))
  assert.ok(!available.some(({ value }) => value === '11:00'))
  assert.ok(available.some(({ value }) => value === '12:00'))
})

test('hides an overnight slot that would end beyond the reservation window', () => {
  const available = getAvailableHours(
    [],
    '2030-02-28',
    new Date(2030, 0, 1).getTime(),
    '2030-02-28',
  )

  assert.ok(available.some(({ value }) => value === '16:00'))
  assert.ok(!available.some(({ value }) => value === '25:00'))
})

test('clamps a one-month reservation range to the last day of the shorter month', () => {
  assert.equal(getOneMonthLater(new Date(2030, 0, 31)), '2030-02-28')
  assert.equal(getOneMonthLater(new Date(2032, 0, 31)), '2032-02-29')
})

test('reads, validates, and saves bookings in local storage', () => {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  }

  const booking = makeBooking('2030-01-15T09:00')
  assert.deepEqual(readBookings(), [])
  saveBookings([booking])
  assert.deepEqual(readBookings(), [{ ...booking, status: 'pending' }])
  assert.ok(store.has(BOOKINGS_STORAGE_KEY))
})

test('accepts or declines a booking and persists the decision', () => {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  }
  const booking = makeBooking('2030-01-15T09:00')
  saveBookings([booking])

  assert.deepEqual(
    updateBookingDecision(
      booking.id,
      'accepted',
      new Date(2030, 0, 15, 9, 30).getTime(),
    ),
    [{ ...booking, status: 'accepted' }],
  )
  assert.deepEqual(readBookings(), [
    { ...booking, status: 'accepted' },
  ])

  assert.deepEqual(
    updateBookingDecision(
      booking.id,
      'declined',
      new Date(2030, 0, 15, 9, 30).getTime(),
    ),
    [{ ...booking, status: 'declined' }],
  )
  assert.deepEqual(readBookings(), [
    { ...booking, status: 'declined' },
  ])
  assert.throws(() => updateBookingDecision(booking.id, 'unknown'), /Unsupported/)
  assert.throws(() => updateBookingDecision('missing', 'accepted'), /not be found/)
})

test('automatically finishes accepted bookings one hour after the appointment starts', () => {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  }
  const booking = {
    ...makeBooking('2030-01-15T09:00'),
    status: 'accepted',
  }
  saveBookings([booking])

  assert.equal(
    finishElapsedAppointments(new Date(2030, 0, 15, 9, 59).getTime())[0].status,
    'accepted',
  )
  assert.equal(
    finishElapsedAppointments(new Date(2030, 0, 15, 10, 0).getTime())[0].status,
    'finished',
  )
  assert.equal(readBookings()[0].status, 'finished')
})

test('keeps declined bookings declined after their appointment time', () => {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  }
  const booking = {
    ...makeBooking('2030-01-15T09:00'),
    status: 'declined',
  }
  saveBookings([booking])

  assert.equal(
    finishElapsedAppointments(new Date(2030, 0, 15, 12, 0).getTime())[0].status,
    'declined',
  )
})

test('migrates the previous in-appointment status to accepted', () => {
  globalThis.window = {
    localStorage: {
      getItem: () =>
        JSON.stringify([
          { ...makeBooking('2030-01-15T09:00'), status: 'in-appointment' },
        ]),
      setItem: () => {},
    },
  }

  assert.equal(readBookings()[0].status, 'accepted')
})

test('reports malformed stored booking data instead of treating it as empty', () => {
  globalThis.window = {
    localStorage: {
      getItem: () => 'not-json',
      setItem: () => {},
    },
  }

  assert.throws(() => readBookings(), SyntaxError)

  globalThis.window.localStorage.getItem = () => JSON.stringify([{ name: 'missing fields' }])
  assert.throws(() => readBookings(), /unexpected format/)
})
