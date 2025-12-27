// Session List page - shows all sessions
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SessionSummary } from '../types'

export default function SessionList() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Load sessions when page opens
  useEffect(() => {
    loadSessions()
    // Reload every 5 seconds
    const timer = setInterval(loadSessions, 5000)
    return () => clearInterval(timer)
  }, [])

  // Fetch sessions from API
  async function loadSessions() {
    try {
      const response = await fetch('/api/sessions')
      if (!response.ok) throw new Error('Failed to load')
      const data = await response.json()
      setSessions(data)
      setError('')
    } catch (e) {
      setError('Could not load sessions')
    } finally {
      setLoading(false)
    }
  }

  // Format duration nicely
  function formatDuration(ms: number | null) {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Format date nicely
  function formatDate(iso: string) {
    return new Date(iso).toLocaleString()
  }

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadSessions}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>No sessions yet</h3>
          <p>Run your pipeline with X-Ray SDK to see traces here.</p>
        </div>
      </div>
    )
  }

  // Normal state - show the list
  return (
    <div className="container">
      <h2 style={{ marginBottom: '24px' }}>Sessions ({sessions.length})</h2>
      <div className="session-list">
        {sessions.map(session => (
          <div
            key={session.sessionId}
            className="session-item"
            onClick={() => navigate(`/session/${session.sessionId}`)}
          >
            <div className={`session-status ${session.status}`} />
            <div className="session-info">
              <div className="session-name">{session.name}</div>
              <div className="session-meta">
                <span>{formatDate(session.startedAt)}</span>
                <span>{session.stepCount} steps</span>
                <span>{formatDuration(session.durationMs)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
