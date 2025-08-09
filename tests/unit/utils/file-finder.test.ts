import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { findLogFiles, convertProjectPathToFileName, findClaudeLogFiles } from '../../../src/utils/file-finder'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'

vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    access: vi.fn()
  }
}))
vi.mock('os')

describe('file-finder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('findLogFiles', () => {
    it('should find .jsonl files in directory', async () => {
      const mockReaddir = vi.mocked(fs.readdir)
      mockReaddir.mockResolvedValueOnce([
        { name: 'test1.jsonl', isFile: () => true, isDirectory: () => false },
        { name: 'test2.jsonl', isFile: () => true, isDirectory: () => false },
        { name: 'test.log', isFile: () => true, isDirectory: () => false },
        { name: 'subdir', isFile: () => false, isDirectory: () => true },
      ] as any)
      
      // Mock for subdirectory
      mockReaddir.mockResolvedValueOnce([
        { name: 'test3.jsonl', isFile: () => true, isDirectory: () => false },
      ] as any)

      const result = await findLogFiles('/test/dir')
      
      expect(result).toEqual([
        '/test/dir/test1.jsonl',
        '/test/dir/test2.jsonl',
        '/test/dir/subdir/test3.jsonl'
      ])
    })

    it('should handle missing directory gracefully', async () => {
      const mockReaddir = vi.mocked(fs.readdir)
      mockReaddir.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))

      const result = await findLogFiles('/nonexistent')
      
      expect(result).toEqual([])
    })

    it('should handle empty directory', async () => {
      const mockReaddir = vi.mocked(fs.readdir)
      mockReaddir.mockResolvedValueOnce([])

      const result = await findLogFiles('/empty/dir')
      
      expect(result).toEqual([])
    })
  })

  describe('convertProjectPathToFileName', () => {
    it('should convert absolute project path to Claude format', () => {
      const result = convertProjectPathToFileName('/home/user/projects/my-app')
      expect(result).toBe('-home-user-projects-my-app')
    })

    it('should handle paths with trailing slashes', () => {
      const result = convertProjectPathToFileName('/home/user/project/')
      expect(result).toBe('-home-user-project')
    })

    it('should handle relative paths', () => {
      const result = convertProjectPathToFileName('projects/my-app')
      expect(result).toBe('-projects-my-app')
    })

    it('should handle Windows-style paths', () => {
      const result = convertProjectPathToFileName('C:\\Users\\user\\project')
      expect(result).toBe('-C-Users-user-project')
    })
  })

  describe('findClaudeLogFiles', () => {
    it('should check both old and new Claude paths', async () => {
      const mockHomedir = vi.mocked(os.homedir)
      mockHomedir.mockReturnValue('/home/testuser')

      const mockReaddir = vi.mocked(fs.readdir)
      
      // Mock new path ~/.config/claude/projects
      mockReaddir.mockResolvedValueOnce([
        { name: 'project1.jsonl', isFile: () => true, isDirectory: () => false },
      ] as any)
      
      // Mock old path ~/.claude/projects
      mockReaddir.mockResolvedValueOnce([
        { name: 'project2.jsonl', isFile: () => true, isDirectory: () => false },
      ] as any)

      const result = await findClaudeLogFiles()
      
      expect(result).toContain('/home/testuser/.config/claude/projects/project1.jsonl')
      expect(result).toContain('/home/testuser/.claude/projects/project2.jsonl')
    })

    it('should find current project log file when project path is provided', async () => {
      const mockHomedir = vi.mocked(os.homedir)
      mockHomedir.mockReturnValue('/home/testuser')

      const mockReaddir = vi.mocked(fs.readdir)
      
      // Mock that the project directory exists with JSONL files
      mockReaddir.mockImplementation(async (path) => {
        if (path === '/home/testuser/.config/claude/projects/-home-testuser-my-project') {
          return [
            { name: 'session1.jsonl', isFile: () => true, isDirectory: () => false },
            { name: 'session2.jsonl', isFile: () => true, isDirectory: () => false }
          ] as any
        }
        throw new Error('Directory not found')
      })

      const result = await findClaudeLogFiles('/home/testuser/my-project')
      
      expect(result).toContain('/home/testuser/.config/claude/projects/-home-testuser-my-project/session1.jsonl')
      expect(result).toContain('/home/testuser/.config/claude/projects/-home-testuser-my-project/session2.jsonl')
    })

    it('should handle missing directories gracefully', async () => {
      const mockHomedir = vi.mocked(os.homedir)
      mockHomedir.mockReturnValue('/home/testuser')

      const mockReaddir = vi.mocked(fs.readdir)
      mockReaddir.mockRejectedValue(new Error('ENOENT'))

      const result = await findClaudeLogFiles()
      
      expect(result).toEqual([])
    })

    it('should remove duplicate paths', async () => {
      const mockHomedir = vi.mocked(os.homedir)
      mockHomedir.mockReturnValue('/home/testuser')

      const mockReaddir = vi.mocked(fs.readdir)
      const mockAccess = vi.mocked(fs.access)
      
      // Mock same file in both directories
      mockReaddir.mockResolvedValueOnce([
        { name: 'project.jsonl', isFile: () => true, isDirectory: () => false },
      ] as any)
      mockReaddir.mockResolvedValueOnce([
        { name: 'project.jsonl', isFile: () => true, isDirectory: () => false },
      ] as any)
      
      // Mock that the specific project file exists
      mockAccess.mockResolvedValue()

      const result = await findClaudeLogFiles('/home/testuser/project')
      
      // Should have unique paths
      const uniquePaths = [...new Set(result)]
      expect(result.length).toBe(uniquePaths.length)
    })
  })
})