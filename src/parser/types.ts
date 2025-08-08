/**
 * Parser type definitions
 */

export interface ToolCall {
  name: string
  timestamp: Date
  parameters?: Record<string, unknown>
  duration?: number
  success: boolean
  error?: string
}

export interface SubagentCall {
  name: string
  timestamp: Date
  prompt?: string
  duration?: number
  success: boolean
  error?: string
}

export interface LogEntry {
  type: 'tool' | 'subagent' | 'message'
  timestamp: Date
  content: ToolCall | SubagentCall | string
}

export interface ParseResult {
  entries: LogEntry[]
  summary: {
    totalTools: number
    totalSubagents: number
    totalMessages: number
    startTime?: Date
    endTime?: Date
  }
}