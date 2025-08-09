import { describe, it, expect } from 'vitest'
import { parseClaudeLog } from '../../src/parser/claude-log-parser.js'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { tmpdir } from 'os'

describe('ClaudeLogParser Integration', () => {
  const testDir = join(tmpdir(), `cctoolstats-test-${Date.now()}`)
  const testFile = join(testDir, 'sample.jsonl')

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {}
  })

  it('should parse a realistic Claude Code log sequence', async () => {
    // Create a realistic log sequence similar to actual Claude Code logs
    const logEntries = [
      // User message
      {
        parentUuid: null,
        isSidechain: false,
        userType: 'external',
        cwd: '/home/user/project',
        sessionId: 'session-123',
        version: '1.0.60',
        gitBranch: 'main',
        type: 'user',
        timestamp: '2025-08-01T10:00:00.000Z',
        uuid: 'uuid-1',
        message: {
          role: 'user',
          content: [
            { type: 'text', text: 'Please list the files in the current directory' }
          ]
        }
      },
      // Assistant response with tool use
      {
        parentUuid: 'uuid-1',
        isSidechain: false,
        userType: 'external',
        cwd: '/home/user/project',
        sessionId: 'session-123',
        version: '1.0.60',
        gitBranch: 'main',
        type: 'assistant',
        timestamp: '2025-08-01T10:00:01.000Z',
        uuid: 'uuid-2',
        message: {
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          model: 'claude-opus-4-20250514',
          content: [
            { type: 'text', text: 'I\'ll list the files in the current directory.' },
            {
              type: 'tool_use',
              id: 'toolu_bash_1',
              name: 'Bash',
              input: { command: 'ls -la', description: 'List files in current directory' }
            }
          ]
        }
      },
      // Tool result
      {
        parentUuid: 'uuid-2',
        isSidechain: false,
        userType: 'external',
        cwd: '/home/user/project',
        sessionId: 'session-123',
        version: '1.0.60',
        gitBranch: 'main',
        type: 'user',
        timestamp: '2025-08-01T10:00:02.000Z',
        uuid: 'uuid-3',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_bash_1',
              content: 'total 24\ndrwxr-xr-x  3 user user 4096 Aug  1 10:00 .\ndrwxr-xr-x 10 user user 4096 Aug  1 09:00 ..\n-rw-r--r--  1 user user  220 Aug  1 09:30 README.md',
              is_error: false
            }
          ]
        },
        toolUseResult: {
          stdout: 'total 24\ndrwxr-xr-x  3 user user 4096 Aug  1 10:00 .\ndrwxr-xr-x 10 user user 4096 Aug  1 09:00 ..\n-rw-r--r--  1 user user  220 Aug  1 09:30 README.md',
          stderr: '',
          is_error: false
        }
      },
      // Assistant continues with another tool
      {
        parentUuid: 'uuid-3',
        isSidechain: false,
        userType: 'external',
        cwd: '/home/user/project',
        sessionId: 'session-123',
        version: '1.0.60',
        gitBranch: 'main',
        type: 'assistant',
        timestamp: '2025-08-01T10:00:03.000Z',
        uuid: 'uuid-4',
        message: {
          id: 'msg_124',
          type: 'message',
          role: 'assistant',
          model: 'claude-opus-4-20250514',
          content: [
            { type: 'text', text: 'Now let me read the README file.' },
            {
              type: 'tool_use',
              id: 'toolu_read_1',
              name: 'Read',
              input: { file_path: '/home/user/project/README.md' }
            }
          ]
        }
      },
      // Another tool result
      {
        parentUuid: 'uuid-4',
        isSidechain: false,
        userType: 'external',
        cwd: '/home/user/project',
        sessionId: 'session-123',
        version: '1.0.60',
        gitBranch: 'main',
        type: 'user',
        timestamp: '2025-08-01T10:00:04.000Z',
        uuid: 'uuid-5',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_read_1',
              content: '# Project README\n\nThis is a sample project.',
              is_error: false
            }
          ]
        }
      }
    ]

    // Write JSONL file
    const jsonl = logEntries.map(entry => JSON.stringify(entry)).join('\n')
    writeFileSync(testFile, jsonl)

    // Parse the file
    const entries = await parseClaudeLog(testFile)

    // Verify parsed entries
    expect(entries).toHaveLength(2) // Should find 2 tool uses
    
    // First tool use
    expect(entries[0].type).toBe('tool')
    expect(entries[0].content.name).toBe('Bash')
    expect(entries[0].content.id).toBe('toolu_bash_1')
    expect(entries[0].content.input).toEqual({
      command: 'ls -la',
      description: 'List files in current directory'
    })
    expect(entries[0].timestamp).toEqual(new Date('2025-08-01T10:00:01.000Z'))

    // Second tool use
    expect(entries[1].type).toBe('tool')
    expect(entries[1].content.name).toBe('Read')
    expect(entries[1].content.id).toBe('toolu_read_1')
    expect(entries[1].content.input).toEqual({
      file_path: '/home/user/project/README.md'
    })
    expect(entries[1].timestamp).toEqual(new Date('2025-08-01T10:00:03.000Z'))
  })

  it('should handle mixed tool types in a session', async () => {
    const tools = ['Bash', 'Read', 'Write', 'Edit', 'MultiEdit', 'Grep', 'Glob', 'Task']
    const logEntries = tools.map((toolName, index) => ({
      parentUuid: index > 0 ? `uuid-${index}` : null,
      isSidechain: false,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '1.0.60',
      gitBranch: '',
      type: 'assistant' as const,
      timestamp: `2025-08-01T10:${String(index).padStart(2, '0')}:00.000Z`,
      uuid: `uuid-${index + 1}`,
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use' as const,
            id: `toolu_${toolName.toLowerCase()}_${index}`,
            name: toolName,
            input: { test: `data_${index}` }
          }
        ]
      }
    }))

    const jsonl = logEntries.map(entry => JSON.stringify(entry)).join('\n')
    writeFileSync(testFile, jsonl)

    const entries = await parseClaudeLog(testFile)

    expect(entries).toHaveLength(tools.length)
    entries.forEach((entry, index) => {
      expect(entry.type).toBe('tool')
      expect(entry.content.name).toBe(tools[index])
      expect(entry.content.id).toBe(`toolu_${tools[index].toLowerCase()}_${index}`)
    })
  })

  it('should handle empty log file gracefully', async () => {
    writeFileSync(testFile, '')
    const entries = await parseClaudeLog(testFile)
    expect(entries).toEqual([])
  })

  it('should skip malformed JSON lines', async () => {
    const content = [
      '{"invalid json',
      JSON.stringify({
        type: 'assistant',
        timestamp: '2025-08-01T10:00:00Z',
        uuid: 'valid-1',
        message: {
          content: [
            { type: 'tool_use', id: 'tool-1', name: 'Bash', input: {} }
          ]
        }
      }),
      'not json at all',
      JSON.stringify({
        type: 'assistant',
        timestamp: '2025-08-01T10:01:00Z',
        uuid: 'valid-2',
        message: {
          content: [
            { type: 'tool_use', id: 'tool-2', name: 'Read', input: {} }
          ]
        }
      })
    ].join('\n')

    writeFileSync(testFile, content)
    const entries = await parseClaudeLog(testFile)
    
    expect(entries).toHaveLength(2)
    expect(entries[0].content.name).toBe('Bash')
    expect(entries[1].content.name).toBe('Read')
  })
})