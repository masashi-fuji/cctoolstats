import { describe, it, expect } from 'vitest'
import { formatJson } from '../../../src/formatters/json.js'

describe('formatJson', () => {
  it('should format simple object', () => {
    const data = { name: 'Test', count: 5 }
    const result = formatJson(data)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual(data)
    expect(result).toContain('\n')  // Should be pretty-printed
  })

  it('should format array', () => {
    const data = [1, 2, 3]
    const result = formatJson(data)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual(data)
  })

  it('should format nested object', () => {
    const data = {
      tools: {
        totalInvocations: 10,
        toolCounts: { Bash: 5, Read: 5 }
      }
    }
    const result = formatJson(data)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual(data)
    expect(result.split('\n').length).toBeGreaterThan(3)  // Pretty-printed
  })

  it('should handle null and undefined', () => {
    const data = { nullValue: null, undefinedValue: undefined }
    const result = formatJson(data)
    const parsed = JSON.parse(result)
    expect(parsed.nullValue).toBeNull()
    expect(parsed.undefinedValue).toBeUndefined()
  })

  it('should use 2-space indentation', () => {
    const data = { nested: { value: 'test' } }
    const result = formatJson(data)
    expect(result).toContain('  "nested"')  // 2 spaces
  })
})