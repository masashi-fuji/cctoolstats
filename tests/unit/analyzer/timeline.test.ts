import { describe, it, expect } from 'vitest'
import { analyzeTimeline } from '../../../src/analyzer/timeline.js'
import type { LogEntry } from '../../../src/parser/types.js'

describe('analyzeTimeline', () => {
  it('should return empty array for empty input', () => {
    const result = analyzeTimeline([])
    expect(result).toEqual([])
  })

  it('should return empty array for null input', () => {
    const result = analyzeTimeline(null as any)
    expect(result).toEqual([])
  })

  it('should convert tool entries to timeline events', () => {
    const entries: LogEntry[] = [
      {
        type: 'tool',
        timestamp: '2025-08-01T10:00:00Z',
        content: { name: 'Bash', id: 'tool1', input: {} }
      }
    ]

    const result = analyzeTimeline(entries)
    
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('tool')
    expect(result[0].name).toBe('Bash')
    expect(result[0].timestamp).toEqual(new Date('2025-08-01T10:00:00Z'))
  })

  it('should convert subagent entries to timeline events', () => {
    const entries: LogEntry[] = [
      {
        type: 'subagent',
        timestamp: '2025-08-01T10:01:00Z',
        content: { name: 'code-reviewer', id: 'agent1', input: {} }
      }
    ]

    const result = analyzeTimeline(entries)
    
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('subagent')
    expect(result[0].name).toBe('code-reviewer')
  })

  it('should handle message entries', () => {
    const entries: LogEntry[] = [
      {
        type: 'message' as any,
        timestamp: '2025-08-01T10:02:00Z',
        content: { text: 'Hello' }
      }
    ]

    const result = analyzeTimeline(entries)
    
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('message')
    expect(result[0].name).toBeUndefined()
  })

  it('should sort events by timestamp', () => {
    const entries: LogEntry[] = [
      {
        type: 'tool',
        timestamp: '2025-08-01T10:02:00Z',
        content: { name: 'Read', id: 'tool2', input: {} }
      },
      {
        type: 'tool',
        timestamp: '2025-08-01T10:00:00Z',
        content: { name: 'Bash', id: 'tool1', input: {} }
      },
      {
        type: 'subagent',
        timestamp: '2025-08-01T10:01:00Z',
        content: { name: 'code-reviewer', id: 'agent1', input: {} }
      }
    ]

    const result = analyzeTimeline(entries)
    
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('Bash')
    expect(result[1].name).toBe('code-reviewer')
    expect(result[2].name).toBe('Read')
  })

  it('should filter out entries without timestamps', () => {
    const entries: LogEntry[] = [
      {
        type: 'tool',
        timestamp: '2025-08-01T10:00:00Z',
        content: { name: 'Bash', id: 'tool1', input: {} }
      },
      {
        type: 'tool',
        timestamp: null as any,
        content: { name: 'Read', id: 'tool2', input: {} }
      },
      {
        type: 'tool',
        timestamp: undefined as any,
        content: { name: 'Write', id: 'tool3', input: {} }
      }
    ]

    const result = analyzeTimeline(entries)
    
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Bash')
  })

  it('should handle mixed entry types', () => {
    const entries: LogEntry[] = [
      {
        type: 'tool',
        timestamp: '2025-08-01T10:00:00Z',
        content: { name: 'Bash', id: 'tool1', input: {} }
      },
      {
        type: 'subagent',
        timestamp: '2025-08-01T10:01:00Z',
        content: { name: 'code-reviewer', id: 'agent1', input: {} }
      },
      {
        type: 'message' as any,
        timestamp: '2025-08-01T10:02:00Z',
        content: {}
      }
    ]

    const result = analyzeTimeline(entries)
    
    expect(result).toHaveLength(3)
    expect(result.map(e => e.type)).toEqual(['tool', 'subagent', 'message'])
  })
})