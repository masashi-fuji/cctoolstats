/**
 * File finder utility
 */

import { promises as fs } from 'fs'
import path from 'path'

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
      } else if (entry.isFile() && entry.name.endsWith('.log')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error)
  }
  
  return files
}