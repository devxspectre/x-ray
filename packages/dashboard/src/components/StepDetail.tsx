// Step Detail component - shows details of one step
import { useState } from 'react'
import { Step } from '../types'
import ObservationList from './ObservationList'
import EventList from './EventList'
import JsonView from './JsonView'

interface Props {
  step: Step
}

export default function StepDetail({ step }: Props) {
  // Track which sections are open
  const [showInput, setShowInput] = useState(true)
  const [showOutput, setShowOutput] = useState(true)
  const [showObservations, setShowObservations] = useState(true)
  const [showEvents, setShowEvents] = useState(false)

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <span>{step.name}</span>
        <span className="step-type" style={{ marginLeft: '12px' }}>{step.type}</span>
      </div>

      <div className="step-detail">
        {/* Reasoning */}
        {step.reasoning && (
          <div className="detail-section">
            <h3>Reasoning</h3>
            <div style={{
              padding: '12px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              fontStyle: 'italic',
              color: 'var(--text-secondary)'
            }}>
              {step.reasoning}
            </div>
          </div>
        )}

        {/* Metrics */}
        {Object.keys(step.metrics).length > 0 && (
          <div className="detail-section">
            <h3>Metrics</h3>
            <div className="metrics-grid">
              {Object.entries(step.metrics).map(([key, value]) => (
                <div key={key} className="metric-card">
                  <div className="metric-value">{value.toLocaleString()}</div>
                  <div className="metric-label">{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observations */}
        {step.observations.length > 0 && (
          <div className="detail-section">
            <div
              className={`collapsible-header ${showObservations ? 'open' : ''}`}
              onClick={() => setShowObservations(!showObservations)}
            >
              <h3 style={{ margin: 0 }}>Observations ({step.observations.length})</h3>
            </div>
            {showObservations && (
              <div style={{ marginTop: '12px' }}>
                <ObservationList observations={step.observations} />
              </div>
            )}
          </div>
        )}

        {/* Events */}
        {step.events.length > 0 && (
          <div className="detail-section">
            <div
              className={`collapsible-header ${showEvents ? 'open' : ''}`}
              onClick={() => setShowEvents(!showEvents)}
            >
              <h3 style={{ margin: 0 }}>Events ({step.events.length})</h3>
            </div>
            {showEvents && (
              <div style={{ marginTop: '12px' }}>
                <EventList events={step.events} />
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="detail-section">
          <div
            className={`collapsible-header ${showInput ? 'open' : ''}`}
            onClick={() => setShowInput(!showInput)}
          >
            <h3 style={{ margin: 0 }}>Input</h3>
          </div>
          {showInput && (
            <div style={{ marginTop: '12px' }}>
              <JsonView data={step.input} />
            </div>
          )}
        </div>

        {/* Output */}
        <div className="detail-section">
          <div
            className={`collapsible-header ${showOutput ? 'open' : ''}`}
            onClick={() => setShowOutput(!showOutput)}
          >
            <h3 style={{ margin: 0 }}>Output</h3>
          </div>
          {showOutput && (
            <div style={{ marginTop: '12px' }}>
              <JsonView data={step.output} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
