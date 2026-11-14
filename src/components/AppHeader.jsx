import { useEffect, useRef, useState } from 'react'

const navigationItems = [
  { id: 'guides', label: 'Troubleshooter' },
  { id: 'booking', label: 'Book a repair' },
]

function AppHeader({ activeView, onViewChange, username, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    if (!isProfileOpen) return undefined

    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileOpen])

  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label="Device Fix home">
        <span className="brand-mark" aria-hidden="true">D</span>
        <span>device<span className="brand-accent">fix</span></span>
      </a>

      <nav className="main-navigation" aria-label="Main navigation">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`navigation-button${activeView === item.id ? ' is-active' : ''}`}
            type="button"
            aria-current={activeView === item.id ? 'page' : undefined}
            onClick={() => onViewChange(item.id)}
          >
            {item.label}
          </button>
        ))}
        <a className="navigation-button admin-navigation-button" href="/admin">
          Admin
        </a>
        {username && (
          <div className="profile-menu" ref={profileRef}>
            <button
              className="user-avatar"
              type="button"
              aria-label={`Open profile menu for ${username}`}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              aria-controls="profile-menu-content"
              onClick={() => setIsProfileOpen((isOpen) => !isOpen)}
            >
              {username.charAt(0).toUpperCase()}
            </button>
            {isProfileOpen && (
              <div
                className="profile-menu-content"
                id="profile-menu-content"
                role="menu"
                aria-label="Profile"
              >
                <p className="profile-menu-label">Signed in as</p>
                <p className="profile-menu-username">{username}</p>
                <button
                  className="profile-logout-button"
                  type="button"
                  role="menuitem"
                  onClick={onLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

export default AppHeader
