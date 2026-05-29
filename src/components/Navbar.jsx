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
        <button
          className={currentPage === 'signin' ? 'active' : ''}
          type="button"
          onClick={() => onNavigate('signin')}
        >
          {currentUser ? 'Account' : 'Sign In'}
        </button>
        {currentUser ? (
          <button
            className="profile-button"
            type="button"
            onClick={onSignOut}
            aria-label={`Sign out ${currentUser.name}`}
            title="Sign out"
          >
            {getInitials(currentUser.name, currentUser.email)}
          </button>
        ) : null}
      </nav>
    </header>
  )
}

export default Navbar
