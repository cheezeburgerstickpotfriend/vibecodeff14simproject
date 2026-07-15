import type { LogEntry } from '../engine/simulation'

export function EventLog({ log }: { log: LogEntry[] }) {
  const entries = [...log].reverse()

  return (
    <div className="event-log">
      <h2>Event Log</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className={`log-entry log-${entry.kind}`}>
            <span className="log-time">{(entry.timeMs / 1000).toFixed(1)}s</span>
            <span className="log-message">{entry.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
