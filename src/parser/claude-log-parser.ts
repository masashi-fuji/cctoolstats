/**
 * Claude Code transcript log parser
 */

import { ClaudeLogEntry, ClaudeMessageContent, ToolCall, SubagentCall, LogEntry } from './types.js'
import { StreamParser } from './stream-parser.js'

export class ClaudeLogParser {
  private streamParser: StreamParser

  constructor() {
    this.streamParser = new StreamParser({
      emitErrors: false,
      filter: (entry) => this.isValidEntry(entry)
    })
  }

  private isValidEntry(entry: any): boolean {
    return entry && 
           typeof entry === 'object' && 
           'type' in entry && 
           'timestamp' in entry
  }

  async *parseFile(filePath: string): AsyncGenerator<LogEntry> {
    for await (const rawEntry of this.streamParser.parseFile(filePath)) {
      const parsed = this.parseEntry(rawEntry as ClaudeLogEntry)
      if (parsed) {
        yield parsed
      }
    }
  }

  private parseEntry(entry: ClaudeLogEntry): LogEntry | null {
    const timestamp = new Date(entry.timestamp)

    // Handle tool_use entries in assistant messages
    if (entry.type === 'assistant' && entry.message?.content) {
      for (const content of entry.message.content) {
        if (this.isToolUse(content)) {
          return {
            type: 'tool',
            timestamp,
            content: {
              name: content.name,
              timestamp,
              id: content.id,
              input: content.input,
              success: true
            } as ToolCall
          }
        }
      }
    }

    // Handle tool_result entries in user messages
    // For now, we skip these as they're responses to tool_use
    if (entry.type === 'user' && entry.message?.content) {
      for (const content of entry.message.content) {
        if (this.isToolResult(content)) {
          // Skip tool results for now - they complete previous tool calls
          return null
        }
      }
    }

    // Handle system messages (could contain subagent invocations)
    if (entry.type === 'system' && typeof entry.content === 'string') {
      const subagentName = this.extractSubagentName(entry.content)
      if (subagentName) {
        return {
          type: 'subagent',
          timestamp,
          content: {
            name: subagentName,
            timestamp,
            success: true
          } as SubagentCall
        }
      }
    }

    return null
  }

  private isToolUse(content: ClaudeMessageContent): content is { type: 'tool_use'; id: string; name: string; input: any } {
    return content.type === 'tool_use' && 'name' in content && 'id' in content
  }

  private isToolResult(content: ClaudeMessageContent): content is { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean } {
    return content.type === 'tool_result' && 'tool_use_id' in content
  }

  private extractSubagentName(content: string): string | null {
    // Extract subagent name from system messages
    // Examples: "Invoking subagent: code-reviewer", "subagent test-writer started"
    const patterns = [
      /subagent[:\s]+(\w+[-\w]*)/i,
      /invoking\s+(\w+[-\w]*)\s+subagent/i,
      /(\w+[-\w]*)\s+subagent\s+(?:started|invoked)/i
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }
}

export async function parseClaudeLog(filePath: string): Promise<LogEntry[]> {
  const parser = new ClaudeLogParser()
  const entries: LogEntry[] = []
  
  for await (const entry of parser.parseFile(filePath)) {
    entries.push(entry)
  }
  
  return entries
}