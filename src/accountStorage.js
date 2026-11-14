export const USERS_STORAGE_KEY = 'device-fix-users'
const SESSION_STORAGE_KEY = 'device-fix-session'
const PASSWORD_HASH_ITERATIONS = 310_000
const PASSWORD_HASH_LENGTH = 256

function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function readUsers() {
  const savedUsers = window.localStorage.getItem(USERS_STORAGE_KEY)
  if (savedUsers === null) return []

  const users = JSON.parse(savedUsers)
  if (
    !Array.isArray(users) ||
    !users.every(
      (user) =>
        user !== null &&
        typeof user === 'object' &&
        typeof user.username === 'string' &&
        typeof user.normalizedUsername === 'string' &&
        typeof user.salt === 'string' &&
        typeof user.passwordHash === 'string',
    )
  ) {
    throw new Error('Saved account data has an unexpected format.')
  }

  return users
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure password hashing is unavailable in this browser.')
  }

  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    PASSWORD_HASH_LENGTH,
  )
  return toBase64(hash)
}

function saveUsers(users) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

function setSession(username) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, username)
}

export function readUsernames() {
  return readUsers().map((user) => user.username)
}

async function addUser(username, password) {
  const normalizedUsername = normalizeUsername(username)
  const users = readUsers()

  if (!validateUsername(username)) {
    throw new Error('Use 3–30 letters, numbers, underscores, or hyphens for the username.')
  }
  if (password.length < 8) {
    throw new Error('The password must be at least 8 characters.')
  }
  if (users.some((user) => user.normalizedUsername === normalizedUsername)) {
    throw new Error('An account with that username already exists.')
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const user = {
    username: username.trim(),
    normalizedUsername,
    salt: toBase64(salt),
    passwordHash: await hashPassword(password, salt),
  }

  saveUsers([...users, user])
  return { username: user.username }
}

export async function createAccount(username, password) {
  const account = await addUser(username, password)
  setSession(normalizeUsername(account.username))
  return account
}

export async function createManagedAccount(username, password) {
  return addUser(username, password)
}

export function deleteAccount(username) {
  const normalizedUsername = normalizeUsername(username)
  const users = readUsers()
  const updatedUsers = users.filter(
    (user) => user.normalizedUsername !== normalizedUsername,
  )

  if (updatedUsers.length === users.length) {
    throw new Error('The account could not be found.')
  }

  saveUsers(updatedUsers)
  if (window.sessionStorage.getItem(SESSION_STORAGE_KEY) === normalizedUsername) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

export async function login(username, password) {
  const normalizedUsername = normalizeUsername(username)
  const user = readUsers().find(
    (account) => account.normalizedUsername === normalizedUsername,
  )
  if (!user) {
    throw new Error('Invalid username or password.')
  }

  const passwordHash = await hashPassword(password, fromBase64(user.salt))
  if (passwordHash !== user.passwordHash) {
    throw new Error('Invalid username or password.')
  }

  setSession(user.normalizedUsername)
  return { username: user.username }
}

export function readCurrentAccount() {
  const normalizedUsername = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (normalizedUsername === null) return null

  const user = readUsers().find(
    (account) => account.normalizedUsername === normalizedUsername,
  )
  if (!user) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }

  return { username: user.username }
}

export function logout() {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

export function validateUsername(username) {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username.trim())
}
