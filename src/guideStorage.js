import { troubleshootingGuides } from './data.js'

export const GUIDES_STORAGE_KEY = 'device-fix-guides'

function isGuide(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    typeof value.category === 'string' &&
    value.category.trim().length > 0 &&
    typeof value.summary === 'string' &&
    value.summary.trim().length > 0 &&
    Array.isArray(value.steps) &&
    value.steps.length > 0 &&
    value.steps.every((step) => typeof step === 'string' && step.trim().length > 0) &&
    typeof value.safetyNote === 'string' &&
    value.safetyNote.trim().length > 0
  )
}

export function readGuides() {
  const savedValue = window.localStorage.getItem(GUIDES_STORAGE_KEY)
  if (savedValue === null) return troubleshootingGuides

  const guides = JSON.parse(savedValue)
  if (!Array.isArray(guides) || !guides.every(isGuide)) {
    throw new Error('Saved troubleshooting guide data has an unexpected format.')
  }

  return guides
}

export function saveGuides(guides) {
  if (!Array.isArray(guides) || !guides.every(isGuide)) {
    throw new Error('Troubleshooting guides have an unexpected format.')
  }

  window.localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guides))
}

export function addGuide(guide) {
  const guides = readGuides()
  const newGuide = {
    ...guide,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
  const updatedGuides = [...guides, newGuide]
  saveGuides(updatedGuides)
  return updatedGuides
}

export function deleteGuide(guideId) {
  const guides = readGuides()
  const updatedGuides = guides.filter((guide) => guide.id !== guideId)

  if (updatedGuides.length === guides.length) {
    throw new Error('The troubleshooting guide could not be found.')
  }

  saveGuides(updatedGuides)
  return updatedGuides
}
