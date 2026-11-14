import { useState } from 'react'
import {
  createManagedAccount,
  deleteAccount,
  readUsernames,
  validateUsername,
} from '../accountStorage.js'
import { addGuide, deleteGuide, readGuides } from '../guideStorage.js'

const initialGuide = {
  title: '',
  category: '',
  summary: '',
  steps: '',
  safetyNote: '',
}

function AdminManagement() {
  const [storedData] = useState(() => {
    try {
      return {
        usernames: readUsernames(),
        guides: readGuides(),
        error: '',
      }
    } catch {
      return {
        usernames: [],
        guides: [],
        error: 'User or guide data could not be read from browser storage.',
      }
    }
  })
  const [usernames, setUsernames] = useState(storedData.usernames)
  const [guides, setGuides] = useState(storedData.guides)
  const [loadError] = useState(storedData.error)
  const [userError, setUserError] = useState('')
  const [guideError, setGuideError] = useState('')
  const [userSuccess, setUserSuccess] = useState('')
  const [guideSuccess, setGuideSuccess] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [guideForm, setGuideForm] = useState(initialGuide)

  async function handleAddUser(event) {
    event.preventDefault()
    setUserError('')
    setUserSuccess('')

    if (!validateUsername(username)) {
      setUserError('Use 3–30 letters, numbers, underscores, or hyphens.')
      return
    }
    if (password.length < 8) {
      setUserError('The password must be at least 8 characters.')
      return
    }

    try {
      const account = await createManagedAccount(username, password)
      setUsernames(readUsernames())
      setUsername('')
      setPassword('')
      setUserSuccess(`Account for ${account.username} was created.`)
    } catch (error) {
      setUserError(
        error instanceof Error ? error.message : 'The account could not be created.',
      )
    }
  }

  function handleDeleteUser(name) {
    if (!window.confirm(`Delete the account for ${name}?`)) return

    try {
      deleteAccount(name)
      setUsernames(readUsernames())
      setUserError('')
      setUserSuccess(`Account for ${name} was deleted.`)
    } catch (error) {
      setUserSuccess('')
      setUserError(
        error instanceof Error ? error.message : 'The account could not be deleted.',
      )
    }
  }

  function handleAddGuide(event) {
    event.preventDefault()
    setGuideError('')
    setGuideSuccess('')

    const guide = {
      title: guideForm.title.trim(),
      category: guideForm.category.trim(),
      summary: guideForm.summary.trim(),
      steps: guideForm.steps
        .split('\n')
        .map((step) => step.trim())
        .filter(Boolean),
      safetyNote: guideForm.safetyNote.trim(),
    }

    if (
      !guide.title ||
      !guide.category ||
      !guide.summary ||
      !guide.safetyNote ||
      guide.steps.length === 0
    ) {
      setGuideError('Complete every guide field and add at least one step.')
      return
    }

    try {
      setGuides(addGuide(guide))
      setGuideForm(initialGuide)
      setGuideSuccess(`“${guide.title}” was added to the troubleshooter.`)
    } catch (error) {
      setGuideError(
        error instanceof Error ? error.message : 'The guide could not be added.',
      )
    }
  }

  function handleDeleteGuide(guide) {
    if (!window.confirm(`Delete the “${guide.title}” troubleshooting guide?`)) return

    try {
      setGuides(deleteGuide(guide.id))
      setGuideError('')
      setGuideSuccess(`“${guide.title}” was deleted.`)
    } catch (error) {
      setGuideSuccess('')
      setGuideError(
        error instanceof Error ? error.message : 'The guide could not be deleted.',
      )
    }
  }

  return (
    <div className="admin-management">
      {loadError && <p className="storage-message" role="alert">{loadError}</p>}

      <section className="admin-page-panel" aria-labelledby="manage-users-title">
        <div className="booking-list-heading">
          <div>
            <h2 id="manage-users-title">Manage users</h2>
            <p>Add accounts or remove accounts from this browser.</p>
          </div>
          <span className="booking-group-count">{usernames.length}</span>
        </div>

        <form className="admin-create-form" onSubmit={handleAddUser}>
          <div className="form-field">
            <label htmlFor="new-username">Username</label>
            <input
              autoComplete="off"
              id="new-username"
              maxLength={30}
              minLength={3}
              onChange={(event) => {
                setUsername(event.target.value)
                setUserError('')
                setUserSuccess('')
              }}
              pattern="[A-Za-z0-9_-]{3,30}"
              required
              value={username}
            />
          </div>
          <div className="form-field">
            <label htmlFor="new-user-password">Temporary password</label>
            <input
              autoComplete="new-password"
              id="new-user-password"
              minLength={8}
              onChange={(event) => {
                setPassword(event.target.value)
                setUserError('')
                setUserSuccess('')
              }}
              required
              type="password"
              value={password}
            />
          </div>
          <button className="submit-button" type="submit">Add user</button>
        </form>

        {userError && <p className="form-error" role="alert">{userError}</p>}
        {userSuccess && <p className="form-status" role="status">{userSuccess}</p>}
        {usernames.length === 0 ? (
          <p className="empty-bookings">No user accounts have been created.</p>
        ) : (
          <ul className="management-list">
            {usernames.map((name) => (
              <li className="management-list-item" key={name}>
                <span>{name}</span>
                <button
                  className="management-delete-button"
                  onClick={() => handleDeleteUser(name)}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-page-panel" aria-labelledby="manage-guides-title">
        <div className="booking-list-heading">
          <div>
            <h2 id="manage-guides-title">Manage troubleshooting guides</h2>
            <p>New guides are immediately available in the public troubleshooter.</p>
          </div>
          <span className="booking-group-count">{guides.length}</span>
        </div>

        <form className="admin-guide-form" onSubmit={handleAddGuide}>
          <div className="form-field">
            <label htmlFor="guide-title">Issue title</label>
            <input
              id="guide-title"
              maxLength={100}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, title: event.target.value }))
              }
              required
              value={guideForm.title}
            />
          </div>
          <div className="form-field">
            <label htmlFor="guide-category">Category</label>
            <input
              id="guide-category"
              maxLength={40}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, category: event.target.value }))
              }
              placeholder="For example, Battery"
              required
              value={guideForm.category}
            />
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="guide-summary">Short description</label>
            <input
              id="guide-summary"
              maxLength={180}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, summary: event.target.value }))
              }
              required
              value={guideForm.summary}
            />
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="guide-steps">Troubleshooting steps</label>
            <textarea
              id="guide-steps"
              maxLength={3000}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, steps: event.target.value }))
              }
              placeholder={'Enter one step per line\nCheck the cable and power source'}
              required
              rows={5}
              value={guideForm.steps}
            />
            <span className="field-hint">Each non-empty line becomes a numbered step.</span>
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="guide-safety">Safety note</label>
            <textarea
              id="guide-safety"
              maxLength={500}
              onChange={(event) =>
                setGuideForm((current) => ({
                  ...current,
                  safetyNote: event.target.value,
                }))
              }
              required
              rows={2}
              value={guideForm.safetyNote}
            />
          </div>
          <button className="submit-button" type="submit">Add guide</button>
        </form>

        {guideError && <p className="form-error" role="alert">{guideError}</p>}
        {guideSuccess && <p className="form-status" role="status">{guideSuccess}</p>}
        {guides.length === 0 ? (
          <p className="empty-bookings">There are no troubleshooting guides.</p>
        ) : (
          <ul className="management-list">
            {guides.map((guide) => (
              <li className="management-list-item" key={guide.id}>
                <span>
                  <strong>{guide.title}</strong>
                  <span className="management-list-detail">{guide.category}</span>
                </span>
                <button
                  className="management-delete-button"
                  onClick={() => handleDeleteGuide(guide)}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AdminManagement
