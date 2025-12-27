// Observation List component - shows what the step looked at
import { Observation } from '../types'

interface Props {
  observations: Observation[]
}

export default function ObservationList({ observations }: Props) {
  // Get CSS class for the result
  function getResultClass(result: string | null) {
    if (!result) return ''
    if (result === 'pass' || result === 'selected') return 'pass'
    if (result === 'fail' || result === 'rejected') return 'fail'
    return ''
  }

  // Get nice label for the result
  function getResultLabel(result: string | null) {
    if (!result) return ''
    if (result === 'pass') return '✓ Pass'
    if (result === 'fail') return '✗ Fail'
    if (result === 'selected') return '★ Selected'
    if (result === 'rejected') return '✗ Rejected'
    return result
  }

  return (
    <div className="observation-list">
      {observations.map(obs => (
        <div key={obs.id} className={`observation-item ${getResultClass(obs.result)}`}>
          {/* Header row */}
          <div className="observation-header">
            <span className="observation-type">{obs.type}</span>
            <span className="observation-label">{obs.label}</span>
            {obs.result && (
              <span className={`observation-result ${getResultClass(obs.result)}`}>
                {getResultLabel(obs.result)}
              </span>
            )}
          </div>

          {/* Reason */}
          {obs.reason && (
            <div className="observation-reason">{obs.reason}</div>
          )}

          {/* Score */}
          {obs.score !== null && (
            <div style={{ fontSize: '0.875rem', color: 'var(--accent-blue)', marginTop: '4px' }}>
              Score: {obs.score.toFixed(2)}
            </div>
          )}

          {/* Data */}
          {Object.keys(obs.data).length > 0 && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '8px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {Object.entries(obs.data).map(([key, val]) => (
                <span key={key}>
                  {key}: <strong>{String(val)}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Children (nested observations) */}
          {obs.children && obs.children.length > 0 && (
            <div className="observation-children">
              <ObservationList observations={obs.children} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
