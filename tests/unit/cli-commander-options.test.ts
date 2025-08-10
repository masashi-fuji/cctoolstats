import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { run } from '../../src/cli-commander.js'
import * as fileFinder from '../../src/utils/file-finder.js'

// Mock dependencies
vi.mock('../../src/utils/file-finder.js')
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => '{"version": "1.0.0"}'),
  writeFileSync: vi.fn(),
  createReadStream: vi.fn(() => {
    const { Readable } = require('stream')
    return Readable.from([])
  })
}))

describe('CLI Commander Options', () => {
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  const originalProcessExit = process.exit
  const originalProcessCwd = process.cwd

  beforeEach(() => {
    console.log = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
    process.exit = vi.fn() as any
    process.cwd = vi.fn(() => '/test/project')
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
    process.exit = originalProcessExit
    process.cwd = originalProcessCwd
  })

  describe('Project selection options', () => {
    it('should handle --all option', async () => {
      const mockFiles = ['/home/user/.claude/project1.jsonl', '/home/user/.claude/project2.jsonl']
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce(mockFiles)

      await run(['node', 'cctoolstats', '--all'])

      expect(fileFinder.findClaudeLogFiles).toHaveBeenCalledWith()
      expect(fileFinder.findClaudeLogFiles).toHaveBeenCalledTimes(1)
    })

    it('should handle --project option', async () => {
      const projectPath = '/path/to/project'
      const mockFiles = [`/home/user/.claude/${projectPath}.jsonl`]
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce(mockFiles)

      await run(['node', 'cctoolstats', '--project', projectPath])

      expect(fileFinder.findClaudeLogFiles).toHaveBeenCalledWith(projectPath)
      expect(fileFinder.findClaudeLogFiles).toHaveBeenCalledTimes(1)
    })

    it('should handle --current option (explicit)', async () => {
      const mockFiles = ['/home/user/.claude/current-project.jsonl']
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce(mockFiles)

      await run(['node', 'cctoolstats', '--current'])

      expect(fileFinder.findClaudeLogFiles).toHaveBeenCalledWith('/test/project')
      expect(process.cwd).toHaveBeenCalled()
    })

    it('should default to current project when no option specified', async () => {
      const mockFiles = ['/home/user/.claude/current-project.jsonl']
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce(mockFiles)

      await run(['node', 'cctoolstats'])

      expect(fileFinder.findClaudeLogFiles).toHaveBeenCalledWith('/test/project')
      expect(process.cwd).toHaveBeenCalled()
    })

    it('should warn when no files found with --all', async () => {
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce([])

      await run(['node', 'cctoolstats', '--all'])

      expect(console.warn).toHaveBeenCalledWith(
        'No Claude log files found in ~/.claude/projects/ or ~/.config/claude/projects/'
      )
      expect(console.warn).toHaveBeenCalledWith(
        'Please ensure Claude Code has been used and generated logs.'
      )
    })

    it('should warn when no files found with --project', async () => {
      const projectPath = '/nonexistent/project'
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce([])

      await run(['node', 'cctoolstats', '--project', projectPath])

      expect(console.warn).toHaveBeenCalledWith(
        `No Claude log files found for project: ${projectPath}`
      )
    })

    it('should warn when no files found for current project', async () => {
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce([])

      await run(['node', 'cctoolstats', '--current'])

      expect(console.warn).toHaveBeenCalledWith(
        `No Claude log files found for current project: /test/project`
      )
    })
  })

  describe('Verbose mode', () => {
    it('should log file processing in verbose mode', async () => {
      const mockFiles = ['/test/file1.jsonl', '/test/file2.jsonl']
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce(mockFiles)

      await run(['node', 'cctoolstats', '--verbose'])

      expect(console.log).toHaveBeenCalledWith('Processing: /test/file1.jsonl')
      expect(console.log).toHaveBeenCalledWith('Processing: /test/file2.jsonl')
    })

    it('should not log file processing without verbose mode', async () => {
      const mockFiles = ['/test/file1.jsonl']
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce(mockFiles)

      await run(['node', 'cctoolstats'])

      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Processing:'))
    })
  })

  describe('Error handling', () => {
    it('should handle invalid format option', async () => {
      await run(['node', 'cctoolstats', 'test.jsonl', '--format', 'invalid'])

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Invalid format 'invalid'")
      )
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('should handle file read errors gracefully', async () => {
      const mockFiles = ['/test/error.jsonl']
      vi.mocked(fileFinder.findClaudeLogFiles).mockResolvedValueOnce(mockFiles)
      
      const fs = await import('fs')
      vi.mocked(fs.createReadStream).mockImplementationOnce(() => {
        throw new Error('File read error')
      })

      await run(['node', 'cctoolstats'])

      expect(console.error).toHaveBeenCalledWith('Error: File read error')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })
})