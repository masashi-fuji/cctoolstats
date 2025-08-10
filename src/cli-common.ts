/**
 * Common utilities for CLI modules
 * Shared functionality between cli.ts and cli-commander.ts
 */

import { createReadStream, writeFileSync } from 'fs'
import { StreamParser } from './parser/stream-parser.js'
import { ToolAnalyzer } from './analyzer/tool.js'
import { SubagentAnalyzer } from './analyzer/subagent.js'
import { TableFormatter } from './formatters/table.js'

/**
 * Options for processing log files
 */
export interface ProcessOptions {
  verbose: boolean
  format: 'table' | 'json' | 'csv'
  color?: boolean
  thousandSeparator: boolean
}

/**
 * Result of processing log files
 */
export interface ProcessResult {
  toolStats: any
  subagentStats: any
}

/**
 * Process log files and analyze tool/subagent usage
 */
export async function processLogFiles(
  logFiles: string[], 
  options: Pick<ProcessOptions, 'verbose'>
): Promise<ProcessResult> {
  const allEntries: any[] = []
  
  for (const filePath of logFiles) {
    if (options.verbose) {
      console.log(`Processing: ${filePath}`)
    }
    
    const parser = new StreamParser()
    const stream = createReadStream(filePath, { encoding: 'utf8' })
    
    // Parse raw entries and extract tool_use entries
    for await (const rawEntry of parser.parseStream(stream)) {
      // Extract tool_use entries from assistant messages
      if (rawEntry.type === 'assistant' && rawEntry.message?.content) {
        for (const content of rawEntry.message.content) {
          if (content.type === 'tool_use') {
            allEntries.push({
              type: 'tool_use',
              name: content.name,
              input: content.input,
              timestamp: rawEntry.timestamp,
              id: content.id
            })
          }
        }
      }
    }
  }
  
  // Analyze the data
  const toolAnalyzer = new ToolAnalyzer()
  const subagentAnalyzer = new SubagentAnalyzer()
  
  return {
    toolStats: toolAnalyzer.analyze(allEntries),
    subagentStats: subagentAnalyzer.analyze(allEntries)
  }
}

/**
 * Format statistics as JSON
 */
export function formatJson(toolStats: any, subagentStats: any): string {
  return JSON.stringify({
    tools: toolStats,
    subagents: subagentStats
  }, null, 2)
}

/**
 * Format statistics as CSV
 */
export function formatCsv(toolStats: any, subagentStats: any): string {
  const lines: string[] = []
  
  // Header
  lines.push('Type,Name,Count,Percentage')
  
  // Tool data
  const sortedTools = Object.entries(toolStats.toolCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
  
  for (const [tool, count] of sortedTools) {
    const percentage = toolStats.toolPercentages[tool].toFixed(2)
    lines.push(`Tool,${tool},${count},${percentage}`)
  }
  
  // Subagent data
  const sortedAgents = Object.entries(subagentStats.agentCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
  
  for (const [agent, count] of sortedAgents) {
    const percentage = subagentStats.agentPercentages[agent].toFixed(2)
    lines.push(`Subagent,${agent},${count},${percentage}`)
  }
  
  return lines.join('\n')
}

/**
 * Format statistics as table
 */
export function formatTable(
  toolStats: any, 
  subagentStats: any, 
  options: { useColors?: boolean, useThousandSeparator?: boolean }
): string {
  const formatter = new TableFormatter({
    useColors: options.useColors ?? process.stdout.isTTY,
    useThousandSeparator: options.useThousandSeparator ?? false
  })
  return formatter.formatCombinedStats(toolStats, subagentStats)
}

/**
 * Format output based on requested format
 */
export function formatOutput(
  toolStats: any,
  subagentStats: any,
  options: ProcessOptions
): string {
  switch (options.format) {
    case 'json':
      return formatJson(toolStats, subagentStats)
    case 'csv':
      return formatCsv(toolStats, subagentStats)
    case 'table':
    default:
      // Determine if colors should be used
      const useColors = options.color !== undefined 
        ? options.color 
        : process.stdout.isTTY  // Auto-detect based on TTY
      
      return formatTable(toolStats, subagentStats, {
        useColors,
        useThousandSeparator: options.thousandSeparator
      })
  }
}

/**
 * Handle output to console or file
 */
export function handleOutput(output: string, outputFile?: string): void {
  if (outputFile) {
    writeFileSync(outputFile, output)
    console.log(`Output saved to ${outputFile}`)
  } else {
    console.log(output)
  }
}