/**
 * File finder utility
 */

import { promises as fs } from 'fs'
import path from 'path'
import * as os from 'os'

export async function findLogFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findLogFiles(fullPath)
        files.push(...subFiles)
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    // Silently ignore missing directories
  }
  
  return files
}

/**
 * Convert project path to Claude log file name format
 * Example: /home/user/project -> home-user-project.jsonl
 */
export function convertProjectPathToFileName(projectPath: string): string {
  // Remove leading slash and trailing slash, replace all path separators with dashes
  // Also handle Windows-style backslashes
  const normalized = projectPath
    .replace(/^[/\\]+/, '')  // Remove leading slashes or backslashes
    .replace(/[/\\]+$/, '')  // Remove trailing slashes or backslashes
    .replace(/[/\\]+/g, '-') // Replace all path separators with dashes
    .replace(/:/g, ':')      // Keep colons for Windows drive letters
  return `${normalized}.jsonl`
}

/**
 * Find Claude log files in both old and new locations
 * Checks ~/.claude/projects/ and ~/.config/claude/projects/
 */
export async function findClaudeLogFiles(currentProjectPath?: string): Promise<string[]> {
  const homeDir = os.homedir()
  const paths: string[] = []
  
  // Check new path (v1.0.30+)
  const newPath = path.join(homeDir, '.config', 'claude', 'projects')
  const newFiles = await findLogFiles(newPath)
  paths.push(...newFiles)
  
  // Check old path (v1.0.29 and earlier)
  const oldPath = path.join(homeDir, '.claude', 'projects')
  const oldFiles = await findLogFiles(oldPath)
  paths.push(...oldFiles)
  
  // If current project path is provided, look for specific file
  if (currentProjectPath) {
    const fileName = convertProjectPathToFileName(currentProjectPath)
    
    // Check if specific project file exists in either location
    const specificPaths = [
      path.join(newPath, fileName),
      path.join(oldPath, fileName)
    ]
    
    for (const specificPath of specificPaths) {
      try {
        await fs.access(specificPath)
        if (!paths.includes(specificPath)) {
          paths.push(specificPath)
        }
      } catch {
        // File doesn't exist, continue
      }
    }
  }
  
  // Remove duplicates and return
  return [...new Set(paths)]
}