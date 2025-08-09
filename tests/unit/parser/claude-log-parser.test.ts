import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ClaudeLogParser } from '../../../src/parser/claude-log-parser.js'
import { writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('ClaudeLogParser', () => {
  let parser: ClaudeLogParser
  let testFile: string

  beforeEach(() => {
    parser = new ClaudeLogParser()
    testFile = join(tmpdir(), `test-${Date.now()}.jsonl`)
  })

  afterEach(() => {
    try {
      rmSync(testFile)
    } catch {}
  })

  it('should parse tool_use entries', async () => {
    const logData = {
      parentUuid: null,
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'assistant',
      timestamp: '2025-08-01T10:00:00Z',
      uuid: 'test-uuid',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_123',
            name: 'Bash',
            input: { command: 'ls -la' }
          }
        ]
      }
    }

    writeFileSync(testFile, JSON.stringify(logData))

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(1)
    expect(entries[0].type).toBe('tool')
    expect(entries[0].content.name).toBe('Bash')
    expect(entries[0].content.id).toBe('toolu_123')
    expect(entries[0].content.input).toEqual({ command: 'ls -la' })
  })

  it('should handle multiple content types in message', async () => {
    const logData = {
      parentUuid: null,
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'assistant',
      timestamp: '2025-08-01T10:00:00Z',
      uuid: 'test-uuid',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Executing command...' },
          {
            type: 'tool_use',
            id: 'toolu_456',
            name: 'Read',
            input: { file_path: '/test.txt' }
          }
        ]
      }
    }

    writeFileSync(testFile, JSON.stringify(logData))

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(1)
    expect(entries[0].content.name).toBe('Read')
    expect(entries[0].content.input).toEqual({ file_path: '/test.txt' })
  })

  it('should skip tool_result entries for now', async () => {
    const logData = {
      parentUuid: 'parent-uuid',
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'user',
      timestamp: '2025-08-01T10:00:00Z',
      uuid: 'test-uuid',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_123',
            content: 'Command executed successfully'
          }
        ]
      }
    }

    writeFileSync(testFile, JSON.stringify(logData))

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(0)
  })

  it('should parse multiple JSONL lines', async () => {
    const lines = [
      {
        parentUuid: null,
        isSidechain: false,
        userType: 'external',
        cwd: '/test',
        sessionId: 'test-session',
        version: '1.0.60',
        gitBranch: '',
        type: 'assistant',
        timestamp: '2025-08-01T10:00:00Z',
        uuid: 'uuid-1',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'toolu_1', name: 'Bash', input: {} }
          ]
        }
      },
      {
        parentUuid: 'uuid-1',
        isSidechain: false,
        userType: 'external',
        cwd: '/test',
        sessionId: 'test-session',
        version: '1.0.60',
        gitBranch: '',
        type: 'assistant',
        timestamp: '2025-08-01T10:01:00Z',
        uuid: 'uuid-2',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'toolu_2', name: 'Read', input: {} }
          ]
        }
      }
    ]

    const jsonl = lines.map(l => JSON.stringify(l)).join('\n')
    writeFileSync(testFile, jsonl)

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(2)
    expect(entries[0].content.name).toBe('Bash')
    expect(entries[1].content.name).toBe('Read')
  })

  it('should handle various tool names correctly', async () => {
    const toolNames = ['Bash', 'Read', 'Write', 'Edit', 'MultiEdit', 'Grep', 'Glob', 'Task']
    const lines = toolNames.map((name, i) => ({
      parentUuid: null,
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'assistant',
      timestamp: `2025-08-01T10:0${i}:00Z`,
      uuid: `uuid-${i}`,
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: `toolu_${i}`, name, input: {} }
        ]
      }
    }))

    const jsonl = lines.map(l => JSON.stringify(l)).join('\n')
    writeFileSync(testFile, jsonl)

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(toolNames.length)
    entries.forEach((entry, i) => {
      expect(entry.content.name).toBe(toolNames[i])
    })
  })

  it('should extract timestamp correctly', async () => {
    const timestamp = '2025-08-01T14:30:45.123Z'
    const logData = {
      parentUuid: null,
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'assistant',
      timestamp,
      uuid: 'test-uuid',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_123',
            name: 'Bash',
            input: {}
          }
        ]
      }
    }

    writeFileSync(testFile, JSON.stringify(logData))

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(1)
    expect(entries[0].timestamp).toEqual(new Date(timestamp))
  })

  it('should handle empty content arrays', async () => {
    const logData = {
      parentUuid: null,
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'assistant',
      timestamp: '2025-08-01T10:00:00Z',
      uuid: 'test-uuid',
      message: {
        role: 'assistant',
        content: []
      }
    }

    writeFileSync(testFile, JSON.stringify(logData))

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(0)
  })

  it('should handle text-only messages', async () => {
    const logData = {
      parentUuid: null,
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'assistant',
      timestamp: '2025-08-01T10:00:00Z',
      uuid: 'test-uuid',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Just a text message' }
        ]
      }
    }

    writeFileSync(testFile, JSON.stringify(logData))

    const entries = []
    for await (const entry of parser.parseFile(testFile)) {
      entries.push(entry)
    }

    expect(entries).toHaveLength(0)
  })
})