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
  // Claude Code uses a specific format for project directories:
  // - Leading dash is added
  // - All path separators and dots become dashes
  // - No file extension (it's a directory)
  const normalized = projectPath
    .replace(/^[/\\]+/, '')  // Remove leading slashes or backslashes
    .replace(/[/\\]+$/, '')  // Remove trailing slashes or backslashes
    .replace(/[/\\]+/g, '-') // Replace all path separators with dashes
    .replace(/\./g, '-')     // Replace dots with dashes (e.g., github.com -> github-com)
    .replace(/:/g, '')       // Remove colons (Windows drive letters)
  
  // Claude Code adds a leading dash to directory names
  return `-${normalized}`
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
  // Check old path (v1.0.29 and earlier)
  const oldPath = path.join(homeDir, '.claude', 'projects')
  
  if (currentProjectPath) {
    // If specific project path is provided, only look for that project's files
    const dirName = convertProjectPathToFileName(currentProjectPath)
    
    // Check if specific project directory exists and get all JSONL files within it
    const projectDirs = [
      path.join(newPath, dirName),
      path.join(oldPath, dirName)
    ]
    
    for (const projectDir of projectDirs) {
      const projectFiles = await findLogFiles(projectDir)
      paths.push(...projectFiles)
    }
  } else {
    // No project path specified - return all log files
    const newFiles = await findLogFiles(newPath)
    paths.push(...newFiles)
    
    const oldFiles = await findLogFiles(oldPath)
    paths.push(...oldFiles)
  }
  
  // Remove duplicates and return
  return [...new Set(paths)]
}