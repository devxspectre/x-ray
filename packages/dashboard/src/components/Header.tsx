// Header component - shows at the top of every page
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <h1>
        <div className="logo" />
        X-Ray Dashboard
      </h1>
      <Link to="/" className="btn btn-secondary">
        Sessions
      </Link>
    </header>
  )
}
