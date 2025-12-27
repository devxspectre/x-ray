// Event List component - shows events that happened in a step
import { Event } from '../types'

interface Props {
  events: Event[]
}

export default function EventList({ events }: Props) {
  // Format time nicely
  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString()
  }

  return (
    <div className="event-list">
      {events.map((event, index) => (
        <div key={index} className="event-item">
          <span className={`event-type ${event.type}`}>{event.type}</span>
          <span>{event.message}</span>
          <span className="event-time">{formatTime(event.timestamp)}</span>
        </div>
      ))}
    </div>
  )
}
