// Step List component - shows the list of steps on the left
import { Step } from '../types'

// Icons for different step types
const ICONS: Record<string, string> = {
  llm: '🤖',
  search: '🔍',
  filter: '⚡',
  rank: '🏆',
  custom: '⚙️'
}

interface Props {
  steps: Step[]
  selectedStep: Step | null
  onSelect: (step: Step) => void
}

export default function StepList({ steps, selectedStep, onSelect }: Props) {
  // Format duration nicely
  function formatDuration(ms: number | null) {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="timeline">
      {steps.map((step, index) => (
        <div
          key={step.stepId}
          className={`timeline-step ${selectedStep?.stepId === step.stepId ? 'selected' : ''}`}
          onClick={() => onSelect(step)}
        >
          {/* Step icon */}
          <div className={`step-icon ${step.type}`}>
            {ICONS[step.type] || ICONS.custom}
          </div>

          {/* Step info */}
          <div className="step-info">
            <div className="step-header">
              <span className="step-name">{step.name}</span>
              <span className="step-type">{step.type}</span>
            </div>
            <div className="step-duration">
              Step {index + 1} • {formatDuration(step.durationMs)}
            </div>
            {step.reasoning && (
              <div className="step-reasoning">{step.reasoning}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
