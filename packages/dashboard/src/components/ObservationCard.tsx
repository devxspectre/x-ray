// ObservationCard component - Beautiful display of telemetry observations
import { useState } from 'react'
import { Observation } from '../types'
import JsonView from './JsonView'

interface Props {
  observation: Observation
  isExpanded?: boolean
}

export default function ObservationCard({ observation, isExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(isExpanded)
  
  // Get the parsed decision data
  const parsedDecision = observation.data?.parsedDecision
  const prompt = observation.data?.prompt
  const response = observation.data?.response
  const traceId = observation.data?.traceId
  const spanId = observation.data?.spanId
  
  // Extract key decision fields
  const decisionFields = parsedDecision?.rawFields || {}
  const hasDecisionData = Object.keys(decisionFields).length > 0

  // Get status color based on observation result
  function getStatusColor(result: string | null): string {
    switch (result) {
      case 'pass': return 'var(--accent-green)'
      case 'fail': return 'var(--accent-red)'
      case 'selected': return 'var(--accent-blue)'
      default: return 'var(--accent-purple)'
    }
  }

  return (
    <div className="observation-card">
      {/* Header */}
      <div 
        className="observation-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="observation-card-icon">
          {observation.type === 'llm_decision' ? '🧠' : '📊'}
        </div>
        
        <div className="observation-card-title">
          <span className="observation-card-label">{observation.label}</span>
          <span className="observation-card-type">{observation.type}</span>
        </div>

        {observation.result && (
          <div 
            className="observation-card-status"
            style={{ background: getStatusColor(observation.result) }}
          >
            {observation.result.toUpperCase()}
          </div>
        )}
        
        <div className={`observation-card-chevron ${expanded ? 'open' : ''}`}>
          ▶
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="observation-card-content">
          {/* Trace IDs */}
          {(traceId || spanId) && (
            <div className="telemetry-ids">
              {traceId && (
                <div className="telemetry-id">
                  <span className="telemetry-id-label">Trace ID</span>
                  <code className="telemetry-id-value">{traceId}</code>
                </div>
              )}
              {spanId && (
                <div className="telemetry-id">
                  <span className="telemetry-id-label">Span ID</span>
                  <code className="telemetry-id-value">{spanId}</code>
                </div>
              )}
            </div>
          )}

          {/* Decision Fields Grid */}
          {hasDecisionData && (
            <div className="decision-section">
              <h4 className="section-title">🎯 Decision Data</h4>
              <div className="decision-grid">
                {Object.entries(decisionFields).map(([key, value]) => (
                  <div key={key} className="decision-field">
                    <div className="decision-field-key">{key.replace(/_/g, ' ')}</div>
                    <div className="decision-field-value">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt */}
          {prompt && (
            <div className="telemetry-section">
              <h4 className="section-title">📝 Prompt</h4>
              <div className="telemetry-code-block">
                {prompt}
              </div>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="telemetry-section">
              <h4 className="section-title">💬 Response</h4>
              <div className="telemetry-code-block">
                {response}
              </div>
            </div>
          )}

          {/* Reason */}
          {observation.reason && (
            <div className="telemetry-section">
              <h4 className="section-title">💡 Reason</h4>
              <div className="telemetry-reason">
                {observation.reason}
              </div>
            </div>
          )}

          {/* Score */}
          {observation.score !== null && (
            <div className="telemetry-section">
              <h4 className="section-title">📈 Score</h4>
              <div className="telemetry-score">
                <div 
                  className="score-bar"
                  style={{ width: `${Math.min(observation.score * 100, 100)}%` }}
                />
                <span className="score-value">{(observation.score * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Raw Data (collapsed by default) */}
          <details className="telemetry-raw">
            <summary>View Raw Data</summary>
            <JsonView data={observation.data} />
          </details>

          {/* Children Observations */}
          {observation.children && observation.children.length > 0 && (
            <div className="observation-children">
              <h4 className="section-title">📦 Child Observations</h4>
              <div className="children-list">
                {observation.children.map((child, index) => (
                  <ObservationCard key={child.id || index} observation={child} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
