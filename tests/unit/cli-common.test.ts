import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatJson, formatCsv, formatTable, formatOutput, handleOutput } from '../../src/cli-common.js'
import * as fs from 'fs'

// Mock fs module
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  createReadStream: vi.fn(),
  readFileSync: vi.fn()
}))

describe('cli-common', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatJson', () => {
    it('should format stats as JSON', () => {
      const toolStats = {
        toolCounts: { Bash: 10, Read: 5 },
        toolPercentages: { Bash: 66.67, Read: 33.33 },
        totalInvocations: 15,
        uniqueTools: 2
      }
      const subagentStats = {
        agentCounts: { 'test-agent': 3 },
        agentPercentages: { 'test-agent': 100 },
        totalInvocations: 3,
        uniqueAgents: 1
      }

      const result = formatJson(toolStats, subagentStats)
      const parsed = JSON.parse(result)

      expect(parsed).toEqual({
        tools: toolStats,
        subagents: subagentStats
      })
    })
  })

  describe('formatCsv', () => {
    it('should format stats as CSV', () => {
      const toolStats = {
        toolCounts: { Bash: 10, Read: 5 },
        toolPercentages: { Bash: 66.67, Read: 33.33 },
        totalInvocations: 15,
        uniqueTools: 2
      }
      const subagentStats = {
        agentCounts: { 'test-agent': 3 },
        agentPercentages: { 'test-agent': 100 },
        totalInvocations: 3,
        uniqueAgents: 1
      }

      const result = formatCsv(toolStats, subagentStats)
      const lines = result.split('\n')

      expect(lines[0]).toBe('Type,Name,Count,Percentage')
      expect(lines[1]).toBe('Tool,Bash,10,66.67')
      expect(lines[2]).toBe('Tool,Read,5,33.33')
      expect(lines[3]).toBe('Subagent,test-agent,3,100.00')
    })

    it('should sort tools and agents by count', () => {
      const toolStats = {
        toolCounts: { Read: 5, Bash: 10, Write: 8 },
        toolPercentages: { Read: 21.74, Bash: 43.48, Write: 34.78 },
        totalInvocations: 23,
        uniqueTools: 3
      }
      const subagentStats = {
        agentCounts: { 'agent-b': 2, 'agent-a': 5 },
        agentPercentages: { 'agent-b': 28.57, 'agent-a': 71.43 },
        totalInvocations: 7,
        uniqueAgents: 2
      }

      const result = formatCsv(toolStats, subagentStats)
      const lines = result.split('\n')

      // Tools should be sorted by count (descending)
      expect(lines[1]).toContain('Bash,10')
      expect(lines[2]).toContain('Write,8')
      expect(lines[3]).toContain('Read,5')

      // Agents should be sorted by count (descending)
      expect(lines[4]).toContain('agent-a,5')
      expect(lines[5]).toContain('agent-b,2')
    })
  })

  describe('formatTable', () => {
    it('should format stats as table with colors disabled', () => {
      const toolStats = {
        toolCounts: { Bash: 10 },
        toolPercentages: { Bash: 100 },
        totalInvocations: 10,
        uniqueTools: 1
      }
      const subagentStats = {
        agentCounts: {},
        agentPercentages: {},
        totalInvocations: 0,
        uniqueAgents: 0
      }

      const result = formatTable(toolStats, subagentStats, {
        useColors: false,
        useThousandSeparator: false
      })

      expect(result).toContain('Tool Usage Statistics')
      expect(result).toContain('Bash')
      expect(result).toContain('10')
    })

    it('should use thousand separator when enabled', () => {
      const toolStats = {
        toolCounts: { Bash: 1000 },
        toolPercentages: { Bash: 100 },
        totalInvocations: 1000,
        uniqueTools: 1
      }
      const subagentStats = {
        agentCounts: {},
        agentPercentages: {},
        totalInvocations: 0,
        uniqueAgents: 0
      }

      const result = formatTable(toolStats, subagentStats, {
        useColors: false,
        useThousandSeparator: true
      })

      expect(result).toContain('1,000')
    })
  })

  describe('formatOutput', () => {
    it('should format as JSON when format is json', () => {
      const toolStats = {
        toolCounts: { Bash: 10 },
        toolPercentages: { Bash: 100 },
        totalInvocations: 10,
        uniqueTools: 1
      }
      const subagentStats = {
        agentCounts: {},
        agentPercentages: {},
        totalInvocations: 0,
        uniqueAgents: 0
      }

      const result = formatOutput(toolStats, subagentStats, {
        format: 'json',
        verbose: false,
        thousandSeparator: false
      })

      const parsed = JSON.parse(result)
      expect(parsed).toHaveProperty('tools')
      expect(parsed).toHaveProperty('subagents')
    })

    it('should format as CSV when format is csv', () => {
      const toolStats = {
        toolCounts: { Bash: 10 },
        toolPercentages: { Bash: 100 },
        totalInvocations: 10,
        uniqueTools: 1
      }
      const subagentStats = {
        agentCounts: {},
        agentPercentages: {},
        totalInvocations: 0,
        uniqueAgents: 0
      }

      const result = formatOutput(toolStats, subagentStats, {
        format: 'csv',
        verbose: false,
        thousandSeparator: false
      })

      expect(result).toContain('Type,Name,Count,Percentage')
      expect(result).toContain('Tool,Bash,10')
    })

    it('should format as table by default', () => {
      const toolStats = {
        toolCounts: { Bash: 10 },
        toolPercentages: { Bash: 100 },
        totalInvocations: 10,
        uniqueTools: 1
      }
      const subagentStats = {
        agentCounts: {},
        agentPercentages: {},
        totalInvocations: 0,
        uniqueAgents: 0
      }

      const result = formatOutput(toolStats, subagentStats, {
        format: 'table',
        verbose: false,
        thousandSeparator: false,
        color: false
      })

      expect(result).toContain('Tool Usage Statistics')
    })
  })

  describe('handleOutput', () => {
    it('should write to file when outputFile is provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const output = 'test output'
      const outputFile = 'output.txt'

      handleOutput(output, outputFile)

      expect(fs.writeFileSync).toHaveBeenCalledWith(outputFile, output)
      expect(consoleSpy).toHaveBeenCalledWith(`Output saved to ${outputFile}`)

      consoleSpy.mockRestore()
    })

    it('should log to console when no outputFile is provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const output = 'test output'

      handleOutput(output)

      expect(fs.writeFileSync).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(output)

      consoleSpy.mockRestore()
    })
  })
})