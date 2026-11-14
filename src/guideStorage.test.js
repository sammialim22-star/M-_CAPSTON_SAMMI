import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { troubleshootingGuides } from './data.js'
import {
  addGuide,
  deleteGuide,
  GUIDES_STORAGE_KEY,
  readGuides,
} from './guideStorage.js'

const originalWindow = globalThis.window

afterEach(() => {
  if (originalWindow === undefined) {
    delete globalThis.window
  } else {
    globalThis.window = originalWindow
  }
})

function installStorage() {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  }
  return store
}

test('uses the built-in guides until custom guides have been saved', () => {
  installStorage()

  assert.deepEqual(readGuides(), troubleshootingGuides)
})

test('adds and deletes troubleshooting guides persistently', () => {
  const store = installStorage()
  const guide = {
    title: 'Printer will not connect',
    category: 'Connectivity',
    summary: 'Check the connection and printer settings.',
    steps: ['Restart the printer.', 'Check the network.'],
    safetyNote: 'Do not open the printer while it is powered on.',
  }

  const addedGuides = addGuide(guide)
  assert.equal(addedGuides.length, troubleshootingGuides.length + 1)
  assert.deepEqual(readGuides(), addedGuides)
  assert.ok(store.has(GUIDES_STORAGE_KEY))

  const remainingGuides = deleteGuide(addedGuides.at(-1).id)
  assert.deepEqual(remainingGuides, troubleshootingGuides)
  assert.deepEqual(readGuides(), troubleshootingGuides)
})

test('rejects malformed saved guide data and unknown guide deletions', () => {
  const store = installStorage()

  store.set(GUIDES_STORAGE_KEY, JSON.stringify([{ id: 'broken' }]))
  assert.throws(() => readGuides(), /unexpected format/)

  store.delete(GUIDES_STORAGE_KEY)
  assert.throws(() => deleteGuide('missing-guide'), /could not be found/)
})
