const navItems = [
  { id: 'timer', label: 'Timer' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

function Navbar({ currentPage, onNavigate }) {
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
      </nav>
    </header>
  )
}

export default Navbar
