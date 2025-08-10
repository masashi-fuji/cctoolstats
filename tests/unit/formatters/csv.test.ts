import { describe, it, expect } from 'vitest'
import { formatCsv } from '../../../src/formatters/csv.js'

describe('formatCsv', () => {
  it('should format empty array', () => {
    const result = formatCsv([])
    expect(result).toBe('')
  })

  it('should format array with single object', () => {
    const data = [{ name: 'Test', count: 5 }]
    const result = formatCsv(data)
    expect(result).toBe('name,count\nTest,5')
  })

  it('should format array with multiple objects', () => {
    const data = [
      { tool: 'Bash', count: 3 },
      { tool: 'Read', count: 2 }
    ]
    const result = formatCsv(data)
    const lines = result.split('\n')
    expect(lines[0]).toBe('tool,count')
    expect(lines[1]).toBe('Bash,3')
    expect(lines[2]).toBe('Read,2')
  })

  it('should handle null and undefined values', () => {
    const data = [
      { name: 'Test', value: null, count: undefined }
    ]
    const result = formatCsv(data)
    expect(result).toBe('name,value,count\nTest,,')
  })

  it('should convert non-string values to strings', () => {
    const data = [
      { bool: true, num: 42, obj: { nested: 'value' } }
    ]
    const result = formatCsv(data)
    expect(result).toBe('bool,num,obj\ntrue,42,[object Object]')
  })
})