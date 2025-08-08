import { describe, it, expect } from 'vitest'
import { parseToolLog } from '../../src/parser/stream-parser.js'

describe('parseToolLog', () => {
  it('should return empty result for empty string', () => {
    const result = parseToolLog('')
    expect(result.entries).toEqual([])
    expect(result.summary.totalTools).toBe(0)
    expect(result.summary.totalSubagents).toBe(0)
    expect(result.summary.totalMessages).toBe(0)
  })

  it('should parse basic log content', () => {
    const logContent = 'test log content'
    const result = parseToolLog(logContent)
    expect(result).toBeDefined()
    expect(result.summary).toBeDefined()
  })
})