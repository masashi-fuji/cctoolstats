/**
 * Subagent usage analyzer
 */

import type { LogEntry } from '../parser/types.js'

export interface SubagentStats {
  name: string
  count: number
  successRate: number
  averageDuration?: number
  errors: number
}

export function analyzeSubagents(entries: LogEntry[]): SubagentStats[] {
  // TODO: Implement subagent analysis logic
  return []
}