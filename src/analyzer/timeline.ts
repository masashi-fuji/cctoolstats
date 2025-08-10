/**
 * Timeline analyzer
 */

import type { LogEntry } from '../parser/types.js'

export interface TimelineEvent {
  timestamp: Date
  type: 'tool' | 'subagent' | 'message'
  name?: string
  duration?: number
}

export function analyzeTimeline(entries: LogEntry[]): TimelineEvent[] {
  if (!entries || entries.length === 0) {
    return []
  }

  return entries
    .filter(entry => entry.timestamp)
    .map(entry => {
      const event: TimelineEvent = {
        timestamp: new Date(entry.timestamp),
        type: entry.type === 'tool' ? 'tool' : 
              entry.type === 'subagent' ? 'subagent' : 'message'
      }

      if (entry.type === 'tool' || entry.type === 'subagent') {
        event.name = entry.content?.name
      }

      return event
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}