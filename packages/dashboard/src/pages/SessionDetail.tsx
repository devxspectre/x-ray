// Session Detail page - shows one session with its steps
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Session, Step } from '../types'
import StepDetail from '../components/StepDetail'
import StepList from '../components/StepList'

export default function SessionDetail() {
  const { id } = useParams()
  const [session, setSession] = useState<Session | null>(null)
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load session when page opens
  useEffect(() => {
    loadSession()
  }, [id])

  // Fetch session from API
  async function loadSession() {
    try {
      const response = await fetch(`/api/sessions/${id}`)
      if (!response.ok) throw new Error('Session not found')
      const data = await response.json()
      setSession(data)
      // Select first step by default
      if (data.steps.length > 0) {
        setSelectedStep(data.steps[0])
      }
      setError('')
    } catch (e) {
      setError('Could not load session')
    } finally {
      setLoading(false)
    }
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
  if (error || !session) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Session not found</h3>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">
            Back to Sessions
          </Link>
        </div>
      </div>
    )
  }

  // Normal state - show the session
  return (
    <div className="container">
      {/* Back link */}
      <div style={{ marginBottom: '16px' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)' }}>
          ← Back to Sessions
        </Link>
      </div>

      {/* Session header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`session-status ${session.status}`} />
          <h2>{session.name}</h2>
        </div>
        <div style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          {session.steps.length} steps • Started {new Date(session.startedAt).toLocaleString()}
        </div>
      </div>

      {/* Two column layout */}
      <div className="two-column">
        <div>
          <StepList
            steps={session.steps}
            selectedStep={selectedStep}
            onSelect={setSelectedStep}
          />
        </div>
        <div>
          {selectedStep ? (
            <StepDetail step={selectedStep} />
          ) : (
            <div className="empty-state">
              <p>Select a step to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
