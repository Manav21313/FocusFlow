const navItems = [
  { id: 'timer', label: 'Timer' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

const getInitials = (name, email) => {
  const source = name || email || 'FocusFlow'
  const parts = source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)

  return parts.map((part) => part[0].toUpperCase()).join('') || 'FF'
}

function Navbar({ currentPage, currentUser, onNavigate, onSignOut }) {
  return (
    <header className="navbar">
      <button
        className="brand-button"
        type="button"
        onClick={() => onNavigate('timer')}
        aria-label="Open timer page"
      >
        <span>FF</span>
        <strong>FocusFlow</strong>
      </button>

      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            className={currentPage === item.id ? 'active' : ''}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
        {currentUser ? (
          <>
            <span className="nav-user-pill" title={currentUser.email}>
              {getInitials(currentUser.displayName, currentUser.email)}
            </span>
            <button
              className="nav-logout-button"
              type="button"
              onClick={onSignOut}
            >
              Log out
            </button>
          </>
        ) : null}
      </nav>
    </header>
  )
}

export default Navbar
