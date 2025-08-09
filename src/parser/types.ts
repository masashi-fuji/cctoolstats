/**
 * Parser type definitions
 */

// Claude Code transcript log types
export interface ClaudeLogEntry {
  parentUuid: string | null
  isSidechain: boolean
  userType: string
  cwd: string
  sessionId: string
  version: string
  gitBranch: string
  type: 'user' | 'assistant' | 'system'
  timestamp: string
  uuid: string
  message?: {
    role: string
    content: Array<ClaudeMessageContent>
    id?: string
    type?: string
    model?: string
  }
  content?: string  // for system messages
  toolUseResult?: any
}

export type ClaudeMessageContent = 
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: any }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }

export interface ToolCall {
  name: string
  timestamp: Date
  id?: string
  input?: Record<string, unknown>
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