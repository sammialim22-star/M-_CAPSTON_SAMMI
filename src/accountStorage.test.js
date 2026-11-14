import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  createAccount,
  createManagedAccount,
  deleteAccount,
  login,
  logout,
  readCurrentAccount,
  readUsernames,
  USERS_STORAGE_KEY,
  validateUsername,
} from './accountStorage.js'

const originalWindow = globalThis.window

afterEach(() => {
  if (originalWindow === undefined) {
    delete globalThis.window
  } else {
    globalThis.window = originalWindow
  }
})

function installStorage() {
  const localStore = new Map()
  const sessionStore = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => localStore.get(key) ?? null,
      setItem: (key, value) => localStore.set(key, value),
    },
    sessionStorage: {
      getItem: (key) => sessionStore.get(key) ?? null,
      setItem: (key, value) => sessionStore.set(key, value),
      removeItem: (key) => sessionStore.delete(key),
    },
  }
  return localStore
}

test('validates usernames without case sensitivity restrictions', () => {
  assert.equal(validateUsername('Repair_User-1'), true)
  assert.equal(validateUsername('ab'), false)
  assert.equal(validateUsername('name with spaces'), false)
})

test('creates accounts with salted hashes and logs in with the right password', async () => {
  const localStore = installStorage()

  assert.deepEqual(await createAccount('RepairUser', 'correct horse battery'), {
    username: 'RepairUser',
  })
  const storedAccounts = JSON.parse(localStore.get(USERS_STORAGE_KEY))
  assert.equal(storedAccounts.length, 1)
  assert.equal(storedAccounts[0].password, undefined)
  assert.notEqual(storedAccounts[0].passwordHash, 'correct horse battery')
  assert.deepEqual(readCurrentAccount(), { username: 'RepairUser' })

  logout()
  assert.equal(readCurrentAccount(), null)
  assert.deepEqual(await login('repairuser', 'correct horse battery'), {
    username: 'RepairUser',
  })
  assert.deepEqual(readCurrentAccount(), { username: 'RepairUser' })
})

test('rejects duplicate usernames and incorrect passwords', async () => {
  installStorage()
  await createAccount('RepairUser', 'correct horse battery')

  await assert.rejects(
    createAccount('repairuser', 'another secure password'),
    /already exists/,
  )
  await assert.rejects(login('RepairUser', 'incorrect password'), /Invalid username or password/)
  await assert.rejects(login('unknown', 'incorrect password'), /Invalid username or password/)
})

test('admin account management adds and deletes users without signing them in', async () => {
  const localStore = installStorage()

  await createManagedAccount('ManagedUser', 'a sufficiently long password')
  assert.deepEqual(readUsernames(), ['ManagedUser'])
  assert.equal(readCurrentAccount(), null)
  assert.equal(JSON.parse(localStore.get(USERS_STORAGE_KEY))[0].password, undefined)

  deleteAccount('manageduser')
  assert.deepEqual(readUsernames(), [])
})

test('admin account creation validates usernames, passwords, and duplicates', async () => {
  installStorage()

  await assert.rejects(createManagedAccount('ab', 'long enough password'), /Use 3–30/)
  await assert.rejects(createManagedAccount('ValidUser', 'short'), /at least 8/)
  await createManagedAccount('ValidUser', 'long enough password')
  await assert.rejects(
    createManagedAccount('validuser', 'another long password'),
    /already exists/,
  )
  assert.throws(() => deleteAccount('missing-user'), /could not be found/)
})
