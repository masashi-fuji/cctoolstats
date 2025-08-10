/**
 * Test data helpers for cctoolstats tests
 */

import type { ToolStats, SubagentStats } from '../../src/types/index.js'

/**
 * Create sample tool statistics for testing
 */
export function createSampleToolStats(): ToolStats {
  return {
    totalInvocations: 7,
    uniqueTools: 5,
    toolCounts: {
      Bash: 3,
      Read: 2,
      Write: 1,
      Edit: 1,
      Grep: 0
    },
    toolPercentages: {
      Bash: 42.86,
      Read: 28.57,
      Write: 14.29,
      Edit: 14.29,
      Grep: 0
    }
  }
}

/**
 * Create sample subagent statistics for testing
 */
export function createSampleSubagentStats(): SubagentStats {
  return {
    totalInvocations: 3,
    uniqueAgents: 2,
    agentCounts: {
      'code-reviewer': 2,
      'test-writer': 1
    },
    agentPercentages: {
      'code-reviewer': 66.67,
      'test-writer': 33.33
    }
  }
}

/**
 * Create a sample tool_use entry
 */
export function createToolUseEntry(name: string, input: any = {}) {
  return {
    type: 'tool_use',
    name,
    input,
    timestamp: new Date().toISOString(),
    id: `toolu_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Create a sample raw log entry
 */
export function createRawLogEntry(toolName: string, timestamp?: string) {
  return {
    parentUuid: null,
    isSidechain: false,
    userType: 'external',
    cwd: '/test',
    sessionId: 'test-session',
    version: '1.0.60',
    gitBranch: '',
    type: 'assistant',
    timestamp: timestamp || new Date().toISOString(),
    uuid: `uuid-${Math.random().toString(36).substr(2, 9)}`,
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: `toolu_${Math.random().toString(36).substr(2, 9)}`,
          name: toolName,
          input: {}
        }
      ]
    }
  }
}