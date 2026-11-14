import { useEffect, useMemo, useState } from 'react'
import { troubleshootingGuides } from '../data.js'
import { GUIDES_STORAGE_KEY, readGuides } from '../guideStorage.js'

function Troubleshooter({ onBookAppointment }) {
  const [guides, setGuides] = useState(troubleshootingGuides)
  const [guidesError, setGuidesError] = useState('')
  const [selectedGuideId, setSelectedGuideId] = useState(
    () => troubleshootingGuides[0]?.id ?? null,
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const categoryFilters = useMemo(
    () => ['all', ...new Set(guides.map((guide) => guide.category))],
    [guides],
  )

  useEffect(() => {
    function refreshGuides(event) {
      if (event?.key && event.key !== GUIDES_STORAGE_KEY) return

      try {
        setGuides(readGuides())
        setGuidesError('')
      } catch {
        setGuidesError('Saved troubleshooting guides could not be loaded.')
      }
    }

    refreshGuides()
    window.addEventListener('storage', refreshGuides)
    return () => window.removeEventListener('storage', refreshGuides)
  }, [])

  const filteredGuides = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return guides.filter((guide) => {
      const matchesCategory =
        activeCategory === 'all' || guide.category === activeCategory
      const searchableText = [
        guide.title,
        guide.category,
        guide.summary,
        ...guide.steps,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, guides, searchTerm])

  const selectedGuide =
    filteredGuides.find((guide) => guide.id === selectedGuideId) ??
    filteredGuides[0] ??
    null

  return (
    <div className="troubleshooter">
      {guidesError && <p className="storage-message" role="alert">{guidesError}</p>}
      <div className="troubleshooter-toolbar">
        <label className="guide-search" htmlFor="guide-search">
          <span className="guide-search-label">Search issues</span>
          <input
            id="guide-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Try battery, Wi‑Fi, screen..."
            aria-label="Search troubleshooting guides"
          />
        </label>

        <div className="guide-filter-pills" aria-label="Filter troubleshooting guides">
          {categoryFilters.map((category) => (
            <button
              key={category}
              type="button"
              className={`guide-filter-button${activeCategory === category ? ' is-selected' : ''}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category === 'all' ? 'All fixes' : category}
            </button>
          ))}
        </div>
      </div>

      {filteredGuides.length === 0 ? (
        <div className="troubleshooter-empty" role="status">
          <h3>No matching fixes found</h3>
          <p>Try a different keyword or reset the filters to see all troubleshooting steps.</p>
          <button
            type="button"
            className="guide-close"
            onClick={() => {
              setSearchTerm('')
              setActiveCategory('all')
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="guide-grid" aria-label="Common device issues">
          {filteredGuides.map((guide) => (
            <button
              key={guide.id}
              className={`guide-card${selectedGuide?.id === guide.id ? ' is-selected' : ''}`}
              type="button"
              aria-pressed={selectedGuide?.id === guide.id}
              onClick={() => setSelectedGuideId(guide.id)}
            >
              <span className="guide-category">{guide.category}</span>
              <span className="guide-title">{guide.title}</span>
              <span className="guide-summary">{guide.summary}</span>
              <span className="guide-action">View steps <span aria-hidden="true">→</span></span>
            </button>
          ))}
        </div>
      )}

      {selectedGuide && (
        <section className="guide-details" aria-live="polite" aria-labelledby="guide-details-title">
          <div className="guide-details-header">
            <div>
              <p className="guide-category">{selectedGuide.category}</p>
              <h2 id="guide-details-title">{selectedGuide.title}</h2>
              <p className="guide-details-summary">{selectedGuide.summary}</p>
            </div>
            <button
              className="guide-close"
              type="button"
              onClick={() => setSelectedGuideId(null)}
            >
              Close guide
            </button>
          </div>

          <h3>Try these steps</h3>
          <ol className="guide-steps">
            {selectedGuide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <aside className="safety-note">
            <strong>Safety note</strong>
            <p>{selectedGuide.safetyNote}</p>
          </aside>

          <section className="troubleshooter-cta" aria-label="Book an appointment">
            <p>Can&apos;t fix it?</p>
            <button
              className="submit-button"
              onClick={onBookAppointment}
              type="button"
            >
              Book an appointment
            </button>
          </section>
        </section>
      )}
    </div>
  )
}

export default Troubleshooter
