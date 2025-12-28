// Step Detail component - Shows telemetry observations only
import { Step } from '../types'
import ObservationCard from './ObservationCard'

interface Props {
  step: Step
}

export default function StepDetail({ step }: Props) {
  const hasObservations = step.observations.length > 0

  return (
    <div className="card telemetry-card">
      {/* Header */}
      <div className="card-header">
        <div className="step-title-row">
          <span className="step-icon-large">
            {step.type === 'llm' ? '🤖' : 
             step.type === 'auto_instrumented' ? '🔌' :
             step.type === 'agent' ? '🕴️' :
             step.type === 'trace_span' ? '🕸️' : '⚙️'}
          </span>
          <div className="step-title-info">
            <span className="step-name-large">{step.name}</span>
            <span className="step-type">{step.type}</span>
          </div>
          {step.durationMs && (
            <div className="step-duration-badge">
              {step.durationMs < 1000 
                ? `${step.durationMs}ms` 
                : `${(step.durationMs / 1000).toFixed(2)}s`}
            </div>
          )}
        </div>
      </div>

      <div className="telemetry-content">
        {/* Reasoning Banner */}
        {step.reasoning && (
          <div className="reasoning-banner">
            <span className="reasoning-icon">💡</span>
            <span className="reasoning-text">{step.reasoning}</span>
          </div>
        )}

        {/* Telemetry Observations */}
        {hasObservations ? (
          <div className="observations-container">
            <h3 className="observations-title">
              <span className="observations-icon">📊</span>
              Telemetry Observations
              <span className="observations-count">{step.observations.length}</span>
            </h3>
            
            <div className="observations-list">
              {step.observations.map((observation, index) => (
                <ObservationCard 
                  key={observation.id || index} 
                  observation={observation}
                  isExpanded={index === 0}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="no-observations">
            <div className="no-observations-icon">📭</div>
            <h4>No Telemetry Observations</h4>
            <p>This step did not generate any telemetry observations.</p>
          </div>
        )}
      </div>
    </div>
  )
}
